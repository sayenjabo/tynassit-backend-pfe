const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Device = require('../models/device');

// ─── Protect: any valid token ─────────────────────────────────────────────────

exports.protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, type, role? }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Restrict to admins only ──────────────────────────────────────────────────

exports.adminOnly = async (req, res, next) => {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const Admin = require('../models/admin');
    const admin = await Admin.findById(req.user.id).select('isActive');

    if (!admin) {
      return res.status(401).json({ message: 'Admin account no longer exists' });
    }
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Auth check failed' });
  }
};

// ─── Restrict to superadmin only ─────────────────────────────────────────────

exports.superAdminOnly = (req, res, next) => {
  if (req.user?.type !== 'admin' || req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};

// ─── Restrict to companies only ───────────────────────────────────────────────

exports.companyOnly = async (req, res, next) => {
  if (req.user?.type !== 'company') {
    return res.status(403).json({ message: 'Company access required' });
  }

  try {
    const Company = require('../models/company');
    const company = await Company.findById(req.user.id).select('isActive');

    if (!company) {
      return res.status(401).json({ message: 'Company account no longer exists' });
    }
    if (!company.isActive) {
      return res.status(403).json({ message: 'Your access has been suspended. Please contact Tynass.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Auth check failed' });
  }
};

// ─── Restrict to activated VR devices only ────────────────────────────────────
// Vérifie que le token vient d'un casque activé et non révoqué

exports.deviceOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No device token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'device') {
      return res.status(403).json({ message: 'Device token required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const device = await Device.findOne({
      metaUserId: decoded.metaUserId,
      deviceToken: hashedToken,
      isActive: true,
    }).populate('company', 'isActive');

    if (!device) {
      return res.status(401).json({ message: 'Device not activated or has been revoked' });
    }

    // The device is active, but the company behind it might have been disabled.
    if (!device.company || !device.company.isActive) {
      return res.status(403).json({
        message: 'Your company access has been suspended. Please contact Tynass.',
      });
    }

    req.user = { id: decoded.id, type: 'device' };
    req.device = device;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired device token' });
  }
};
