import pool from '../config/db.js';

export const createTreatmentPlan = async (req, res) => {
    try {
        const { patientId, planName, planStatus } = req.body;
        const createdByUserId = req.user.userId;

        const newPlan = await pool.query(
            `INSERT INTO TreatmentPlans (PatientID, CreatedByUserID, PlanName, PlanStatus)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [patientId, createdByUserId, planName, planStatus || 'Draft']
        );

        res.status(201).json({
            message: 'Treatment plan created successfully',
            plan: newPlan.rows[0]
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurerd while creating the treatment plan!'
        });
    }
};

export const addTreatmentItem = async (req, res) => {
    try {
        const { planId, procedureName, toothNumber, estimatedCost, itemStatus } = req.body;

        const newItem = await pool.query(
            `INSERT INTO TreatmentPlanItems (TreatmentPlanId, ProcedureName, ToothNumber, EstimatedCost, ItemStatus)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
             [planId, procedureName, toothNumber, estimatedCost, itemStatus || 'Pending']
        );

        res.status(201).json({
            message: 'Treatment plan item created successfully',
            item: newItem.rows[0]
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while creating the treatment plan item!'
        });
    }
};

export const getPatientTreatmentPlans = async (req, res) => {
    try {
        const { patientId } = req.params;
        const loggedInUserId = req.user.userId;

const query = `
            SELECT
                tp.TreatmentPlanID,
                tp.PlanName,
                tp.PlanStatus,
                tp.CreatedDate,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'planItemId', tpi.PlanItemID,
                            'procedureName', tpi.ProcedureName,
                            'toothNumber', tpi.ToothNumber,
                            'estimatedCost', tpi.EstimatedCost,
                            'itemStatus', tpi.ItemStatus  
                        )
                    ) FILTER (WHERE tpi.PlanItemID IS NOT NULL), '[]'
                ) as Items
            FROM TreatmentPlans tp
            LEFT JOIN TreatmentPlanItems tpi ON tp.TreatmentPlanID = tpi.TreatmentPlanID
            JOIN Patients pat ON tp.PatientID = pat.PatientID
            JOIN Users u ON pat.PersonID = u.PersonID
            WHERE tp.PatientID::text = $1 
               OR u.UserID::text = $1
               OR (pat.PatientID = (SELECT pat2.PatientID FROM Patients pat2 JOIN Users u2 ON pat2.PersonID = u2.PersonID WHERE u2.UserID = $2))
            GROUP BY tp.TreatmentPlanID
            ORDER BY tp.CreatedDate DESC;
        `;

        const plans = await pool.query(query, [patientId, loggedInUserId]);

        res.status(200).json({
            message: 'Treatment plans retrieved successfully',
            count: plans.rowCount,
            plans: plans.rows
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while retrieving the treatment plans!'
        });
    }
};