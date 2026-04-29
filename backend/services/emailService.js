const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER || 'no-reply@medfex.com',
                pass: process.env.EMAIL_PASS || 'dummy_password'
            }
        });

        const mailOptions = {
            from: 'MedFex System <noreply@medfex.com>', // Sender address
            to: options.email, // List of receivers
            subject: options.subject, // Subject line
            text: options.message, // Plain text body
            html: options.html // html body (optional)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
};

module.exports = sendEmail;
