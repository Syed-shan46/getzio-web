require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS)

// Routes
app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'support.html'));
});

// Post Route for Support Email
app.post('/api/support', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // 1. Create a transporter (Gmail example)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your email (e.g., support@getzio.com)
            pass: process.env.EMAIL_PASS, // Your App Password
        },
    });

    // 2. Setup email data
    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER, // Where the mail goes
        subject: `[Support Inquiry] ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #FF385C;">New Support Inquiry</h2>
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
        console.log('✅ Support email sent successfully!');
        res.status(200).json({ success: true, message: 'Message sent!' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
