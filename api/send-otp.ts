import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_PASS?.trim();

    if (!gmailUser || !gmailPass) {
      return res.status(500).json({ 
        error: 'Email configuration missing. Please set GMAIL_USER and GMAIL_PASS in Vercel environment variables.' 
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      tls: {
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
    res.status(500).json({ 
      error: error.message || 'Failed to send OTP email.',
      code: error.code
    });
  }
}
