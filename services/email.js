const nodemailer = require("nodemailer");
const CustomError = require("../utils/customError");

const createTransporter = () => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        throw new CustomError('Email configuration missing', 500);
    }
    
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        }
    });
};

const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        
        const emailOptions = {
            from: `Rento Support <${process.env.GMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html || options.message.replace(/\n/g, '<br>')
        };
        
        const info = await transporter.sendMail(emailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new CustomError('Failed to send email. Please try again later.', 500);
    }
};

module.exports = sendEmail;