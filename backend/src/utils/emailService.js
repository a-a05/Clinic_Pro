import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendOTP = async (identifier, otpCode) => {
    const isEmail = identifier.includes('@');

    if(isEmail) {
        const mailOptions = {
            from: `"Clinic pro support" <${process.env.EMAIL_USER}>`,
            to: identifier,
            subject: 'Your OTP Code - Clinic Pro Verification',
            text: `Hello, \n\nYour OTP code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this message.`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP Email sent successfullt to ${identifier}`);

        }catch (error) {
            console.error('Error sending OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }else {
        console.log(`SMS sending to ${identifier} is not fully implemented yet. OTP is: ${otpCode}`);
        throw new Error('SMS service not configured yet');
    }
};