import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../utils/emailService.js';
export const register = async (req, res) => {
    try {
        const { firstName, lastName, phoneNo, email, username, password, role_id } = req.body;

        const EmailCheck = await pool.query('SELECT * FROM People WHERE Email = $1', [email]);
        if (EmailCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Email already exists!'
            });
        }

        const UserCheck = await pool.query('SELECT * FROM Users WHERE UserName = $1', [username]);
        if (UserCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Username already exists!'
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newPerson = await pool.query(
            'INSERT INTO People (FirstName, LastName, PhoneNo, Email) VALUES ($1, $2, $3, $4) RETURNING PersonID',
            [firstName, lastName, phoneNo, email]
        );

        const personId = newPerson.rows[0].personid;
        
        const newUser = await pool.query(
            'INSERT INTO Users (PersonID, UserName, Password, RoleID) VALUES ($1, $2, $3, $4) RETURNING UserID, UserName',
            [personId, username, hashedPassword, role_id]
        );

        res.status(201).json({
            message: 'User created successfully!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'error occured while creating the user'
        });
    }
};

export const login = async (req, res) => {
    try{
        const { username, password } = req.body;

        const userQuery = await pool.query(`
            SELECT u.*, r.RoleName
            FROM Users u 
            JOIN Roles r on u.RoleID = r.RoleID
            WHERE u.UserName = $1`,
            [username]
        );

        if (userQuery.rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid username or password'
            });
        }

        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                error: 'Invalid username or password'
            });
        }

        const token = jwt.sign(
            {userId: user.userid, roleId: user.roleid},
            process.env.JWT_SECRET,
            {expiresIn: '1d'}
        );

        res.status(200).json({
            message: 'login successfull!',
            token,
            user: {
                userId: user.userid,
                username: user.username,
                role: user.rolename
            }
        });

    }catch(err) {
        console.error('Error in login: ', err.message);
        res.status(500).json({
            error: 'An error occured while logging in!'
        });
    }
};

export const registerPatientOnline = async (req, res) => {
    const client = await pool.connect();
    try {
        const { firstName, lastName, phoneNo, email, username, password} = req.body;

        const EmailCheck = await client.query('SELECT * FROM People WHERE Email = $1', [email]);
        if (EmailCheck.rows.length > 0) {
            client.release();
            return res.status(400).json({
                message: 'Email already exists!'
            });
        }

        const UserCheck = await client.query('SELECT * FROM Users WHERE UserName = $1', [username]);
        if (UserCheck.rows.length > 0) {
            client.release();
            return res.status(400).json({
                message: 'Username already exists!'
            });
        }

        const roleQuery = await client.query("SELECT RoleID FROM Roles WHERE RoleName ='Patient'");
        if (roleQuery.rows.length === 0) {
            client.release();
            return res.status(500).json({
                message: 'Role "Patient" not configured in the database!'
            });
        }

        const patientRoleId = roleQuery.rows[0].roleid;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await client.query('BEGIN');

        const newPerson = await client.query(
            'INSERT INTO People (FirstName, LastName, PhoneNo, Email) VALUES ($1, $2, $3, $4) RETURNING PersonID',
            [firstName, lastName, phoneNo, email] 
        );

        const personId = newPerson.rows[0].personid;

        const newUser = await client.query(
            'INSERT INTO Users (PersonID, UserName, Password, RoleID) VALUES ($1, $2, $3, $4) RETURNING UserID',
            [personId,  username, hashedPassword, patientRoleId]
        );

        const userId = newUser.rows[0].userid;

        const newPatient = await client.query(
            'INSERT INTO Patients (PersonID, CreatedByUserID) VALUES ($1, $2) RETURNING PatientID',
            [personId, userId] 
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Patient registered successfully!',
            patientId: newPatient.rows[0].patientid,
            userId: userId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Transaction Error', err.message);
        res.status(500).json({
            error: 'An error occurred while registering the patient'
        });
    } finally {
        client.release();
    }
};

export const forgotCredentials = async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.status(400).json({
            error: 'Please provide an email or a phone number'
        });
    }

    try{
        const userCheck = await pool.query(
            `SELECT u.UserID, p.Email,p.phoneNo
             FROM Users u
             JOIN People p ON u.PersonID = p.PersonID
             WHERE p.Email = $1 OR p.PhoneNo = $1`,
             [identifier]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found with this identifier'
            });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date(Date.now() + 10 * 60000);

        await pool.query(
            `INSERT INTO OTP_Tokens (Identifier, OTP_Code, ExpiresAt)
             VALUES ($1, $2, $3)`,
             [identifier, otpCode, expiresAt]
        );

        await sendOTP(identifier, otpCode);
        return res.status(200).json({
            message: 'OTP sent successfully. please check your email or phone number'
        });

    }catch(error){
        console.error('Error in forgotCredentials:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

export const verifyOTP = async (req, res) => {
    const { identifier, otpCode } = req.body;

    if(!identifier || !otpCode) {
        return res.status(400).json({
            error: 'Please provide both identifier and OTP code'
        });
    }
    
    try {
        const otpRecord = await pool.query(
            `SELECT * FROM OTP_Tokens 
             WHERE Identifier = $1
             ORDER BY CreatedAt DESC LIMIT 1`,
             [identifier]
        );

        if(otpRecord.rows.length === 0){
            return res.status(400).json({
                error: 'No OTP code found for this identifier'
            });
        }

        const latestOTP = otpRecord.rows[0];
        console.log("Full DB Record:", latestOTP);
        const dbCode = latestOTP.otp_code || latestOTP.OTP_Code;  
        console.log("Code from DB:  ", `'${dbCode}'`);
        console.log("Code from User:", `'${otpCode}'`);

        if(String(dbCode).trim() !== String(otpCode).trim()){
            return res.status(400).json({
                error: 'Invalid OTP code'
            });
        }

        const currentTime = new Date();
        const expiresAt = new Date(latestOTP.expiresat || latestOTP.ExpiresAt);

        if(currentTime > expiresAt){
            await pool.query(
                `DELETE FROM OTP_Tokens WHERE OTP_ID = $1`,
                [latestOTP.otp_id || latestOTP.OTP_ID]
            );
            return res.status(400).json({
                error: 'OTP code has expired. Please request a new code.'
            });
        }

        const resetToken = jwt.sign(
            {identifier: identifier},
            process.env.JWT_SECRET,
            {expiresIn: '15m'}
        );

        await pool.query(
            `DELETE FROM OTP_Tokens WHERE OTP_ID = $1`,
            [latestOTP.otp_id || latestOTP.OTP_ID]
        );

        return res.status(200).json({
            message: 'OTP code verified successfully. You can now reset your password.',
            resetToken: resetToken
        });

    } catch(error) {
        console.error('Error in verifing the OTP code:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

export const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    if(!resetToken || !newPassword) {
        return res.status(400).json({
            error: 'Please provide the reset token and the new password'
        });
    }

    try{
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        const identifier = decoded.identifier;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const updateQuery = `
            UPDATE Users
            SET Password = $1
            FROM People 
            WHERE Users.PersonID = People.PersonID
            AND (People.Email = $2 OR People.PhoneNo = $2)
            RETURNING Users.UserID;
        `;
        const result = await pool.query(updateQuery, [hashedPassword, identifier]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Password reset successfully. You can now login'
        });

    }catch(error){
        console.error('Error in resetPassword: ', error.message);
        return res.status(500).json({
            error: 'Invalid or expired reset token. Please restart the OTP process.'
        });
    }
};

export const recoverUsername = async (req, res) => {
    const { resetToken } = req.body;
    if(!resetToken) {
        return res.status(400).json({
            error: 'Please provide the reset Token'
        });
    }

    try{
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        const identifier = decoded.identifier;
        const query = `
            SELECT u.UserName 
            FROM Users u
            JOIN People p ON u.PersonID = p.PersonID
            WHERE p.Email = $1 OR p.PhoneNo = $1;
        `;

        const result = await pool.query(query, [identifier]);

        if(result.rows.length === 0){
            return res.status(400).json({
                error: 'User not found'
            });
        }

        const username = result.rows[0].username || result.rows[0].UserName;

        return res.status(200).json({
            message: 'Username recovered successfully',
            username: username
        });
    }catch(error){
        console.error('Error in recoverUsername: ', error.message);
        return res.status(500).json({
            error: 'Invalid or expired reset token. Please restart the OTP process.'
        });
    }
};
