import express from 'express';
import { register, login, registerPatientOnline, forgotCredentials, verifyOTP, resetPassword, recoverUsername } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/register-online', registerPatientOnline);
router.post('/forgot-credentials', forgotCredentials);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/recover-username', recoverUsername)

export default router;