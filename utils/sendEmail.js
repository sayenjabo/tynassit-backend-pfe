const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Verify Connection ────────────────────────────────────────────────────────

transporter.verify()
  .then(() => console.log('Mail server is ready to send messages'))
  .catch((err) => console.error('Mail server verification failed:', err));

// ─── Token Event (OAuth2) ─────────────────────────────────────────────────────

transporter.on('token', (token) => {
  console.log('New access token for %s:', token.user, token.accessToken);
});

// ─── Send Reset Email ─────────────────────────────────────────────────────────

const sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const message = {
    from: `"${process.env.SMTP_FROM_NAME || 'Auth App'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Visit this link to reset your password: ${resetUrl}. If you did not request this, please ignore this email.`,
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent:', info.messageId);

    if (info.rejected.length > 0) {
      console.warn('Some recipients were rejected:', info.rejected);
    }
  } catch (err) {
    switch (err.code) {
      case 'ECONNECTION':
      case 'ETIMEDOUT':
        console.error('Network error - retry later:', err.message);
        break;
      case 'EAUTH':
        console.error('Authentication failed:', err.message);
        break;
      case 'EENVELOPE':
        console.error('Invalid recipients:', err.rejected);
        break;
      default:
        console.error('Send failed:', err.message);
    }
    throw err; // Re-throw so the controller can handle it
  }
};

module.exports = { sendResetEmail };