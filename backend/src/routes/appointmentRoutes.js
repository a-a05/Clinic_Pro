import express from 'express';
import { addAppointment, getAllAppointments, getAvailableSolts } from '../controllers/appointmentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', verifyToken, addAppointment);
router.get('/', verifyToken, authorizeRoles('Receptionist', 'Administrator', 'Doctor', 'Patient'), getAllAppointments);
router.get('/available-slots', getAvailableSolts);

export default router;

