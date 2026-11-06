import pool from '../config/db.js';

export const createInvoice = async (req, res) => {
    try{
        const { patientId, visitId, totalAmount, invoiceStatus } = req.body;
        const createdByUserId = req.user.userId;
        const invoiceNumber = `INV-${Date.now()}`;

        const newInvoice = await pool.query(
            `INSERT INTO Invoices (PatientID, VisitID, CreatedByUserID, InvoiceNumber, TotalAmount, InvoiceStatus)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [patientId, visitId, createdByUserId, invoiceNumber, totalAmount, invoiceStatus || 'Unpaid']
        );

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: newInvoice.rows[0]
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while creating the invoice'
        });
    }
};

export const addPayment = async (req, res) => {
    try{
        const { invoiceId, amount, method } = req.body;
        const receivedByUserId = req.user.userId;

        const newPayment = await pool.query(
            `INSERT INTO Payments (InvoiceID, ReceivedByUserID, Amount, Method)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [invoiceId, receivedByUserId, amount, method || 'Cash']
        );

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment: newPayment.rows[0]
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while recording the payment'
        });
    }
};

export const getAllInvoices = async (req, res) => {
    try{
        const userId = req.user.userId;
        const roleQuery = await pool.query(
            `SELECT r.RoleName FROM Users u
             JOIN Roles r ON u.RoleID = r.RoleID
             WHERE u.UserID = $1`,
             [userId]
        );

        const userRole = roleQuery.rows[0].rolename;
        const queryParams = [];
        let whereClause = '';

        if (userRole === 'Patient') {
            whereClause = `WHERE p.PersonID = (SELECT PersonID FROM Users WHERE UserID = $1)`;
            queryParams.push(userId);
        }
        const query = `
            SELECT 
                i.InvoiceID,
                i.InvoiceNumber,
                i.TotalAmount,
                i.InvoiceStatus,
                i.IssuedAt,
                peo.FirstName || ' ' || peo.LastName AS PatientName,
                COALESCE(SUM(pay.Amount), 0) AS AmountPaid
            FROM Invoices i
            JOIN Patients p ON i.PatientID = p.PatientID
            JOIN People peo ON p.PersonID = peo.PersonID
            LEFT JOIN Payments pay ON i.InvoiceID = pay.InvoiceID
            ${whereClause}
            GROUP BY i.InvoiceID, peo.FirstName, peo.LastName
            ORDER BY i.IssuedAt DESC;
        `;

        const invoices = await pool.query(query, queryParams);

        res.status(200).json({
            message: 'Invoices retrieved successfully',
            count: invoices.rowCount,
            invoices: invoices.rows
        });

    }catch(err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while retrieving the invoices!'
        });
    }
};