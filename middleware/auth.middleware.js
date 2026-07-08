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

exports.adminOnly = (req, res, next) => {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ─── Restrict to superadmin only ─────────────────────────────────────────────

exports.superAdminOnly = (req, res, next) => {
  if (req.user?.type !== 'admin' || req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};

// ─── Restrict to companies only ───────────────────────────────────────────────

exports.companyOnly = (req, res, next) => {
  if (req.user?.type !== 'company') {
    return res.status(403).json({ message: 'Company access required' });
  }
  next();
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

    // Vérifier que le token n'a pas été révoqué en DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const device = await Device.findOne({
      metaUserId: decoded.metaUserId,
      deviceToken: hashedToken,
      isActive: true,
    });

    if (!device) {
      return res.status(401).json({ message: 'Device not activated or has been revoked' });
    }

    // Attacher les infos du device à la requête
    req.user = { id: decoded.id, type: 'device' };
    req.device = device;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired device token' });
  }
};
