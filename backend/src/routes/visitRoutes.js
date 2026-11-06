import express from 'express';
import { addVisit, updateVisitStatus, addVisitNote} from '../controllers/visitController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', verifyToken,addVisit);
router.put('/:visitId/status', verifyToken, updateVisitStatus);
router.post('/note', verifyToken, addVisitNote);

export default router;