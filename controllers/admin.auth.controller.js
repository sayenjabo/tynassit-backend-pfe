const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// ─── Helper ───────────────────────────────────────────────────────────────────

const signToken = (adminId, role) =>
  jwt.sign({ id: adminId, role, type: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    const token = signToken(admin._id, admin.role);

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
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

exports.me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

   const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    res.json({
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Create First Superadmin (setup only — route DISABLED) ────────────────────

exports.createSuperAdmin = async (req, res) => {
  try {
    const existing = await Admin.findOne({ role: 'superadmin' });
    if (existing) {
      return res.status(409).json({ message: 'A superadmin already exists' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    res.status(201).json({
      message: 'Superadmin created successfully',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Staff Management (superadmin only) ───────────────────────────────────────

exports.getStaff = async (req, res) => {
  try {
    const staff = await Admin.find({ role: 'staff' }).select('-password');
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const staff = await Admin.create({ name, email, password: hashed, role: 'staff' });

    res.status(201).json({
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;

    const staff = await Admin.findOneAndUpdate(
      { _id: req.params.id, role: 'staff' },
      { name, email, isActive },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Admin.findOneAndDelete({ _id: req.params.id, role: 'staff' });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
