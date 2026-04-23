import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending OTP
  app.post('/api/send-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
      const gmailUser = process.env.GMAIL_USER?.trim();
      const gmailPass = process.env.GMAIL_PASS?.trim();

      if (!gmailUser || !gmailPass) {
        console.error('GMAIL_USER or GMAIL_PASS environment variables are missing.');
        return res.status(500).json({ 
          error: 'Email configuration missing. Please set GMAIL_USER and GMAIL_PASS in Secrets.' 
        });
      }

      console.log(`Attempting to send OTP email to ${email} using ${gmailUser} (Password length: ${gmailPass.length})`);

      // Create a transporter using Gmail SMTP
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: gmailUser,
        to: email,
        subject: 'ADMIN Login OTP Verification',
        text: `Your 6-digit OTP for ADMIN login is: ${otp}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
            <h2 style="color: #095161; text-align: center;">ADMIN Security Verification</h2>
            <p>A login attempt was made for the ADMIN account. Use the code below to verify your identity:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #095161; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: any) {
      console.error('Error sending email:', error);
      let errorMessage = 'Failed to send OTP email.';
      
      if (error.message?.includes('Application-specific password required')) {
        errorMessage = 'Gmail requires an App Password. Please generate one in your Google Account settings (Security > 2-Step Verification > App passwords).';
      } else if (error.message?.includes('Invalid login') || error.code === 'EAUTH') {
        errorMessage = 'Invalid Gmail credentials (535). Please ensure you are using an App Password (NOT your regular password) and that GMAIL_USER is your full email address.';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection to Gmail SMTP server failed. Please try again later.';
      }

      res.status(500).json({ 
        error: errorMessage, 
        code: error.code,
        response: error.response,
        details: error.message 
      });
    }
  });

  // API Route for testing email configuration
  app.get('/api/test-email', async (req, res) => {
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_PASS?.trim();

    if (!gmailUser || !gmailPass) {
      return res.status(400).json({ error: 'GMAIL_USER or GMAIL_PASS missing in Secrets.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });

    try {
      await transporter.verify();
      res.json({ success: true, message: 'Gmail configuration is valid!' });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code,
        suggestion: 'Ensure you are using a 16-character App Password from Google.'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
