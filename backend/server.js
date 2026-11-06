import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import visitRoutes from './src/routes/visitRoutes.js';
import treatmentRoutes from './src/routes/treatmentRoutes.js';
import invoiceRoutes from './src/routes/invoiceRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.json({
        message: "server is working perfectly"
    });
});

app.get('/api/roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Roles');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error"});
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
});