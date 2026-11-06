import pool from '../config/db.js';

export const addAppointment = async (req, res) => {
    try {
        let {patientId, doctorUserId, appointmentDate, startsAt, endsAt, reason, appointmentStatus } = req.body;

        const createdByUserId = req.user.userId;

        const patientCheck = await pool.query(
            'SELECT PatientID FROM Patients WHERE PersonID = (SELECT PersonID FROM Users WHERE UserID = $1)',
            [createdByUserId]
        );

        if (patientCheck.rows.length > 0) {
            patientId = patientCheck.rows[0].patientid;

        }else if (!patientId) {
            return res.status(400).json({
                error: 'Patient ID is required for receptionists!'
            });
        }

        const newAppointment = await pool.query(
            `INSERT INTO Appointments 
            (PatientID, DoctorUserID, CreatedByUserID, AppointmentDate, StartsAt, EndsAt, Reason, AppointmentStatus)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [patientId, doctorUserId, createdByUserId, appointmentDate, startsAt, endsAt, reason, appointmentStatus]
        );

        res.status(201).json({
            message: 'Appointment created successfully!',
            appointment: newAppointment.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while creating the appointment!'
        });
    }
};

export const getAllAppointments = async (req, res) => {
    try {
        const userId = req.user.userId;

        const roleQuery = await pool.query(
            `SELECT r.RoleName FROM Users u 
             JOIN Roles r ON u.RoleID = r.RoleID 
             WHERE u.UserID = $1`,
             [userId]
        );

        if (roleQuery.rows.length === 0) {
            return res.status(403).json({
                error: 'User not found!'
            });
        }

        const userRole = roleQuery.rows[0].rolename;

        let query = `
            SELECT 
                app.AppointmentID,
                app.AppointmentDate,
                app.StartsAt,
                app.EndsAt,
                app.Reason,
                app.AppointmentStatus,
                pat_peo.FirstName || ' ' || pat_peo.LastName AS PatientName,
                doc_peo.FirstName || ' ' || doc_peo.LastName AS DoctorName
            FROM Appointments app
            JOIN Patients pat ON app.PatientID = pat.PatientID 
            JOIN People pat_peo ON pat.PersonID = pat_peo.PersonID
            JOIN Users doc ON app.DoctorUserID = doc.UserID 
            JOIN People doc_peo ON doc.PersonID = doc_peo.PersonID 
        `;

        const queryParams = [];

        if (userRole === 'Doctor') {
            query += `WHERE app.DoctorUserID = $1
                      ORDER BY app.AppointmentDate DESC,
                      app.StartsAt ASC`;
            queryParams.push(userId);
        }else if (userRole === 'Patient') {
            query += `WHERE pat.PersonID = (SELECT PersonID FROM Users WHERE UserID = $1)
                      OR app.CreatedByUserID = $1
                      ORDER BY app.AppointmentDate DESC,
                      app.StartsAt ASC`;
            queryParams.push(userId);
        }else {
            query += `ORDER BY app.AppointmentDate DESC,
                      app.StratsAt ASC`;
        }

        const appointments = await pool.query(query, queryParams);
        res.status(200).json(appointments.rows)

    }catch(err){
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while fetching the appointments!'
        });
    }
};

export const getAvailableSolts = async (req, res) => {
    try{
        const { date } = req.query;
        if(!date){
            return res.status(400).json({
                error: 'Date parameter is required'
            });
        }
        const doctorQuery = `
            SELECT u.UserID as doctor_id, p.FirstName || ' ' || p.LastName as doctor_name
            FROM Users u
            JOIN People p ON u.PersonID = p.PersonID
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE r.RoleName = 'Doctor' AND IsActive = TRUE
        `;
        const doctorResult = await pool.query(doctorQuery);
        const doctors = doctorResult.rows;

        const appointmentsQuery = `
            SELECT DoctorUserID, TO_CHAR(StartsAt, 'HH24:MI') as start_time
            FROM Appointments
            WHERE AppointmentDate = $1
            AND AppointmentStatus NOT IN ('Cancelled', 'No Show')
        `;
        const appointmentsResult = await pool.query(appointmentsQuery, [date]);
        const bookedAppointments = appointmentsResult.rows;

        const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

        const availableSlots = doctors.map(doc => {
            const doctorBookings = bookedAppointments.filter(app => app.doctoruserid === doc.doctor_id);
            const bookedTimes = doctorBookings.map(app => app.start_time);
            const freeSlots = workingHours.filter(slot => !bookedTimes.includes(slot));

            return {
                doctorId: doc.doctor_id,
                doctorName: doc.doctor_name,
                freeSlots: freeSlots
            };
        });

        res.status(200).json({
            date,
            availableSlots
        });
    }catch(err){
        console.error('Error in getAvailableSlots: ', err.message);
        res.status(500).json({
            error: 'An error occured while fetching the available slots!'
        });
    }
};