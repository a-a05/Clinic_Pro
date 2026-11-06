import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { createInvoice, addPayment, getAllInvoices } from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('Receptionist', 'Administrator'),createInvoice);
router.post('/payment', verifyToken, authorizeRoles('Receptionist', 'Administrator'),addPayment);
router.get('/', verifyToken, authorizeRoles('Receptionist', 'Administrator', 'Patient'), getAllInvoices);

export default router;