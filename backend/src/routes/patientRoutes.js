import express from 'express';
import { getAllPatients } from '../controllers/patientController.js';
import { addPatient } from '../controllers/patientController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', verifyToken, authorizeRoles('Receptionist', 'Administrator'),addPatient);
router.get('/', verifyToken, authorizeRoles( 'Receptionist', 'Doctor', 'Administrator'),getAllPatients);

export default router;