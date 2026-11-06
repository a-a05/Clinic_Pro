import express from 'express';
import { createTreatmentPlan, addTreatmentItem, getPatientTreatmentPlans } from '../controllers/treatmentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/plan', verifyToken, authorizeRoles('Doctor'),createTreatmentPlan);
router.post('/item', verifyToken, authorizeRoles('Doctor'),addTreatmentItem);
router.get('/:patientId', verifyToken, authorizeRoles('Doctor', 'Patient'), getPatientTreatmentPlans);

export default router;