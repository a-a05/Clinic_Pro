import pool from '../config/db.js';

export const addPatient = async (req, res) => {

    const client = await pool.connect();
    try{
        const { 
        nationalId, firstName, secondName, thirdName, lastName, 
        dateOfBirth, gender, address, phoneNo, email,
        nationalCountryId, imagePath 
        } = req.body;

        const createdByUserId = req.user.userId;

        if (nationalId){
            const checkExist = await client.query('SELECT PersonID FROM People WHERE NationalID = $1', [nationalId]);
            if (checkExist.rows.length > 0) {
                client.release();
                return res.status(400).json({
                    message: 'Patient with the entered national ID already exists'
                });
            }
        }

        await client.query('BEGIN');

        const newPerson = await client.query(
            `INSERT INTO People 
            (NationalID, FirstName, SecondName, ThirdName, LastName, DateOfBirth, Gender, Address, PhoneNo, Email, NationalCountryID, ImagePath)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING PersonID`,
            [nationalId, firstName, secondName, thirdName, lastName, dateOfBirth, gender, address, phoneNo, email, nationalCountryId, imagePath]
        );

        const personId = newPerson.rows[0].personid;

        const newPatient = await client.query(
            `INSERT INTO Patients (PersonID, CreatedByUserID)
            VALUES ($1, $2) RETURNING PatientID, CreatedDate`,
            [personId, createdByUserId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Patient added successfully',
            patient: newPatient.rows[0]
        });
    }catch (err){
        await client.query('ROLLBACK');
        console.error('Transaction Error', err.message);
        res.status(500).json({
            error: 'An error occured while adding the patient, changes was rolled back.'
        });
    }finally{
        client.release();
    }
    
};

export const getAllPatients = async (req, res) => {
    try {
        const query = `
        Select 
            pat.PatientID,
            pat.IsActive,
            pat.CreatedDate,
            peo.NationalID,
            peo.FirstName,
            peo.SecondName,
            peo.ThirdName,
            peo.LastName,
            peo.PhoneNo,
            peo.DateOfBirth,
            peo.Gender,
            peo.Address,
            peo.Email
        FROM Patients pat
        JOIN People peo ON pat.PersonID = peo.PersonID
        ORDER BY pat.CreatedDate DESC
        `;

        const patients = await pool.query(query);
        res.status(200).json(patients.rows);

    }catch (err){
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while fetching the patients'
        });
    }
};