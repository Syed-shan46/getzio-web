const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.support = functions.https.onRequest((req, res) => {
    // Handle CORS
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { name, email, subject, message } = req.body;

        // Verify required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).send('Missing required fields');
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
            subject: `[Support Inquiry] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #261FB3;">New Support Inquiry (Getzio Web)</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ success: true, message: 'Message sent!' });
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return res.status(500).json({ success: false, error: error.toString() });
        }
    });
});
