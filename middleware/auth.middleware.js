const jwt = require('jsonwebtoken');

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