const Employee = require('../models/employee');

// ─── Helper: generate unique 6-digit access code ─────────────────────────────

const generateAccessCode = async () => {
  let code, exists;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    exists = await Employee.findOne({ accessCode: code });
  } while (exists);
  return code;
};

// ─── Create Employee ──────────────────────────────────────────────────────────
// Company creates its own employees — companyId comes from the JWT token

exports.createEmployee = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { name, jobTitle, department } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const accessCode = await generateAccessCode();

    const employee = await Employee.create({
      company: companyId,
      name,
      jobTitle: jobTitle || null,
      department: department || null,
      accessCode,
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        jobTitle: employee.jobTitle,
        department: employee.department,
        accessCode: employee.accessCode,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Employees (for this company) ─────────────────────────────────────

exports.getMyEmployees = async (req, res) => {
  try {
    const companyId = req.user.id;

    const employees = await Employee.find({ company: companyId }).select('-milestones');

    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Employee ──────────────────────────────────────────────────────

exports.getEmployee = async (req, res) => {
  try {
    const companyId = req.user.id;

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId });
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
    const companyId = req.user.id;
    const { name, jobTitle, department, isActive } = req.body;

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (name !== undefined) employee.name = name;
    if (jobTitle !== undefined) employee.jobTitle = jobTitle;
    if (department !== undefined) employee.department = department;
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();

    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Employee ──────────────────────────────────────────────────────────

exports.deleteEmployee = async (req, res) => {
  try {
    const companyId = req.user.id;

    const employee = await Employee.findOneAndDelete({ _id: req.params.id, company: companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login with Access Code (VR headset) ─────────────────────────────────────

exports.loginWithCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }

    const employee = await Employee.findOne({ accessCode }).populate('company', 'companyName');
    if (!employee) {
      return res.status(401).json({ message: 'Invalid access code' });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: 'This employee account has been deactivated' });
    }

    res.json({
      message: 'Login successful',
      employee: {
        id: employee._id,
        name: employee.name,
        jobTitle: employee.jobTitle,
        department: employee.department,
        company: employee.company,
        accessCode: employee.accessCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Add Milestone ────────────────────────────────────────────────────────────

exports.addMilestone = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { title, description, type, module } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.milestones.push({
      title,
      description: description || null,
      type,
      module: module || null,
    });

    await employee.save();

    const newMilestone = employee.milestones[employee.milestones.length - 1];

    res.status(201).json({ message: 'Milestone added successfully', milestone: newMilestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Milestones ───────────────────────────────────────────────────────────

exports.getMilestones = async (req, res) => {
  try {
    const companyId = req.user.id;

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId }).select('milestones name');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee: employee.name, milestones: employee.milestones });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Milestone ─────────────────────────────────────────────────────────

exports.updateMilestone = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { status, score } = req.body;

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const milestone = employee.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (status !== undefined) milestone.status = status;
    if (score !== undefined) milestone.score = score;
    if (status === 'completed') milestone.completedAt = new Date();

    await employee.save();

    res.json({ message: 'Milestone updated successfully', milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Milestone ─────────────────────────────────────────────────────────

exports.deleteMilestone = async (req, res) => {
  try {
    const companyId = req.user.id;

    const employee = await Employee.findOne({ _id: req.params.id, company: companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const milestone = employee.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    milestone.deleteOne();
    await employee.save();

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
