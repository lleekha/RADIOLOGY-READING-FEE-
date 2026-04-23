import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_PASS?.trim();

  if (!gmailUser || !gmailPass) {
    return res.status(400).json({ error: 'GMAIL_USER or GMAIL_PASS missing in environment variables.' });
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
}
