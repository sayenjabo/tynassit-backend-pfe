const bcrypt = require('bcryptjs');
const Employee = require('../models/employee');
const Company = require('../models/company');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCompanyPrefix = (companyName) => {
  const words = companyName.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const generateAccessCode = async (companyId, prefix) => {
  const Counter = require('../models/counter');
  const counter = await Counter.findOneAndUpdate(
    { key: `employee_${companyId}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const number = String(counter.seq).padStart(3, '0');
  return `${prefix}-${number}`;
};

const isValidPin = (pin) => /^\d{4}$/.test(String(pin));

const safeEmployee = (emp) => ({
  id: emp._id,
  name: emp.name,
  jobTitle: emp.jobTitle,
  department: emp.department,
  accessCode: emp.accessCode,
  isActive: emp.isActive,
  createdAt: emp.createdAt,
});

// ─── Create Employee ──────────────────────────────────────────────────────────

exports.createEmployee = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { name, jobTitle, department, pin } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!pin || !isValidPin(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const prefix = getCompanyPrefix(company.companyName);
    const accessCode = await generateAccessCode(companyId, prefix);
    const hashedPin = await bcrypt.hash(String(pin), 10);

    const employee = await Employee.create({
      company: companyId,
      name,
      jobTitle: jobTitle || null,
      department: department || null,
      accessCode,
      pin: hashedPin,
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: safeEmployee(employee),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Employees ────────────────────────────────────────────────────────

exports.getMyEmployees = async (req, res) => {
  try {
    const employees = await Employee
      .find({ company: req.user.id })
      .select('-pin -milestones');

    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Employee ──────────────────────────────────────────────────────

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee
      .findOne({ _id: req.params.id, company: req.user.id })
      .select('-pin');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Employee ──────────────────────────────────────────────────────────

exports.updateEmployee = async (req, res) => {
  try {
    const { name, jobTitle, department, isActive, pin } = req.body;

    const employee = await Employee.findOne({ _id: req.params.id, company: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (name !== undefined) employee.name = name;
    if (jobTitle !== undefined) employee.jobTitle = jobTitle;
    if (department !== undefined) employee.department = department;
    if (isActive !== undefined) employee.isActive = isActive;

    if (pin !== undefined) {
      if (!isValidPin(pin)) {
        return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
      }
      employee.pin = await bcrypt.hash(String(pin), 10);
    }

    await employee.save();

    res.json({
      message: 'Employee updated successfully',
      employee: safeEmployee(employee),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Employee ──────────────────────────────────────────────────────────

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      company: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login avec code + PIN (VR headset) ──────────────────────────────────────
// req.user.id = companyId (vient du token du casque via deviceOnly middleware)
// Impossible d'accéder à un employé d'une autre entreprise

exports.loginWithCode = async (req, res) => {
  try {
    const companyId = req.user.id; // extrait du token casque — pas du body
    const { accessCode, pin } = req.body;

    if (!accessCode || !pin) {
      return res.status(400).json({ message: 'Access code and PIN are required' });
    }

    // La recherche est scoped à l'entreprise du casque — cross-company impossible
    const employee = await Employee.findOne({
      accessCode,
      company: companyId,
    });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid access code or PIN' });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    const pinMatch = await bcrypt.compare(String(pin), employee.pin);
    if (!pinMatch) {
      return res.status(401).json({ message: 'Invalid access code or PIN' });
    }

    res.json({
      message: 'Login successful',
      employee: {
        id: employee._id,
        name: employee.name,
        jobTitle: employee.jobTitle,
        department: employee.department,
        accessCode: employee.accessCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Milestones ───────────────────────────────────────────────────────────────

exports.addMilestone = async (req, res) => {
  try {
    const { title, description, type, module } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const employee = await Employee.findOne({ _id: req.params.id, company: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.milestones.push({ title, description: description || null, type, module: module || null });
    await employee.save();

    const newMilestone = employee.milestones[employee.milestones.length - 1];
    res.status(201).json({ message: 'Milestone added successfully', milestone: newMilestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const employee = await Employee
      .findOne({ _id: req.params.id, company: req.user.id })
      .select('name milestones');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee: employee.name, milestones: employee.milestones });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const { status, score } = req.body;

    const employee = await Employee.findOne({ _id: req.params.id, company: req.user.id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const milestone = employee.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    if (status !== undefined) milestone.status = status;
    if (score !== undefined) milestone.score = score;
    if (status === 'completed') milestone.completedAt = new Date();

    await employee.save();
    res.json({ message: 'Milestone updated successfully', milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, company: req.user.id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const milestone = employee.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.deleteOne();
    await employee.save();

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
