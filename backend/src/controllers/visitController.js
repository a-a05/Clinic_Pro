import pool from '../config/db.js';

export const addVisit = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const checkVisit = await pool.query('SELECT * FROM Visits WHERE AppointmentID = $1', [appointmentId]);
        if (checkVisit.rows.length > 0) {
            return res.status(400).json({
                message: 'Visit already exists for this appointment!'
            });
        }

        const newVisit = await pool.query(
            `INSERT INTO Visits (AppointmentID, CheckedInAt, VisitStatus)
            VALUES ($1, CURRENT_TIMESTAMP, 'Checked-In') RETURNING *`,
            [appointmentId]
        );

        res.status(201).json({
            message: 'Patient checked in successfully!',
            visit: newVisit.rows[0]
        });
    }catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while checking-in the patient!'
        });
    }
};

export const updateVisitStatus = async (req, res) => {
    try {
        const { visitId } = req.params;
        const { status } = req.body;

        let updateQuery = '';
        if (status === 'Started'){
            updateQuery = `UPDATE Visits
                           SET StartedAt = CURRENT_TIMESTAMP, VisitStatus = $1 WHERE VisitID = $2 RETURNING *`; 

        } else if (status === 'Ended'){
            updateQuery = `UPDATE Visits
                           SET EndedAt = CURRENT_TIMESTAMP, VisitStatus = $1 WHERE VisitID = $2 RETURNING *`;

        }else{
            return res.status(400).json({
                error: 'Invalid status, Use "Started" or "Ended"'
            });
        }

        const updatedVisit = await pool.query(updateQuery, [status, visitId]);
        if (updatedVisit.rows.length === 0){
            return res.status(404).json({
                error: 'the Visit is not found!'
            });
        }

        res.status(200).json({
            message: `Visit status is updated to ${status}`,
            visit: updatedVisit.rows[0]
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while updated the visit status!'
        });
    }
};

export const addVisitNote = async (req, res) => {
    try {
        const {visitId, noteText} = req.body;

        const writtenByDoctorUserId = req.user.userId;

        const newNote = await pool.query(
            `INSERT INTO VisitNotes (VisitID, WrittenByDoctorUserID, NoteText)
            VALUES ($1, $2, $3) RETURNING *`,
            [visitId, writtenByDoctorUserId, noteText]
        );

        res.status(201).json({
            message: 'Visit note added successfully!',
            note: newNote.rows[0]
        });

    }catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occured while adding the visit note!'
        });
    }
};