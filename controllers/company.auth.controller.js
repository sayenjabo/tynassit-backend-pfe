const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Company = require('../models/company');
const { sendResetEmail } = require('../utils/sendEmail');

// ─── Helper ───────────────────────────────────────────────────────────────────

const signToken = (companyId) =>
  jwt.sign({ id: companyId, type: 'company' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

// ─── Login ────────────────────────────────────────────────────────────────────
// Used by the Quest headset app to authenticate the company
// Returns the company's assigned trainings so the app can display them

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const company = await Company.findOne({ email }).populate('assignedTrainings');
    if (!company || !(await bcrypt.compare(password, company.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!company.isActive) {
      return res
        .status(403)
        .json({ message: 'Your access has been suspended. Please contact Tynass.' });
    }

    const token = signToken(company._id);

    res.json({
      message: 'Login successful',
      token,
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
      },
      // The Quest app uses this list to display the available VR trainings
      trainings: company.assignedTrainings.filter((t) => t.isActive),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

// ─── Me ───────────────────────────────────────────────────────────────────────
// Quest app can call this to refresh company info and trainings list

exports.me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'company') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const company = await Company.findById(decoded.id)
      .select('-password')
      .populate('assignedTrainings');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.isActive) {
      return res
        .status(403)
        .json({ message: 'Your access has been suspended. Please contact Tynass.' });
    }

    res.json({
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
      },
      trainings: company.assignedTrainings.filter((t) => t.isActive),
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const company = await Company.findOne({ email });
    if (!company) {
      return res.json({ message: 'If that email is registered, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    company.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    company.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await company.save();

    await sendResetEmail(company.email, resetToken);

    res.json({ message: 'If that email is registered, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const company = await Company.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // token must not be expired
    });

    if (!company) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    company.password = await bcrypt.hash(password, 12);
    company.resetPasswordToken = null;
    company.resetPasswordExpires = null;
    await company.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};