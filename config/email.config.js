const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('Email transporter verification failed:', error);
        return false;
    }
};

module.exports = {
    transporter,
    verifyTransporter
};