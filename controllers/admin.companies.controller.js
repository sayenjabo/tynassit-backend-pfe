const bcrypt = require('bcryptjs');
const Company = require('../models/company');
const Training = require('../models/training');

// ─── Get All Companies ────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const companies = await Company.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('assignedTrainings', 'title category isActive');

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get One Company ──────────────────────────────────────────────────────────

exports.getOne = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('assignedTrainings', 'title category thumbnailUrl isActive');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Create Company ───────────────────────────────────────────────────────────

exports.create = async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    if (!companyName || !email || !password) {
      return res.status(400).json({ message: 'Company name, email and password are required' });
    }

    const existing = await Company.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'A company with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const company = await Company.create({ companyName, email, password: hashed });

    res.status(201).json({
      message: 'Company created successfully',
      company: { id: company._id, companyName: company.companyName, email: company.email },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Company ───────────────────────────────────────────────────────────

exports.update = async (req, res) => {
  try {
    const { companyName, email, isActive } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (companyName !== undefined) company.companyName = companyName;
    if (email !== undefined) company.email = email;
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    res.json({
      message: 'Company updated successfully',
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        isActive: company.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Company ───────────────────────────────────────────────────────────

exports.remove = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Assign Trainings to Company ──────────────────────────────────────────────
// Replaces the full list of assigned trainings for a company

exports.assignTrainings = async (req, res) => {
  try {
    const { trainingIds } = req.body; // array of Training ObjectIDs

    if (!Array.isArray(trainingIds)) {
      return res.status(400).json({ message: 'trainingIds must be an array' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify all provided IDs actually exist
    const trainings = await Training.find({ _id: { $in: trainingIds } });
    if (trainings.length !== trainingIds.length) {
      return res.status(400).json({ message: 'One or more training IDs are invalid' });
    }

    company.assignedTrainings = trainingIds;
    await company.save();

    await company.populate('assignedTrainings', 'title category isActive');

    res.json({
      message: 'Trainings assigned successfully',
      assignedTrainings: company.assignedTrainings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Add Single Training to Company ──────────────────────────────────────────

exports.addTraining = async (req, res) => {
  try {
    const { trainingId } = req.body;

    if (!trainingId) {
      return res.status(400).json({ message: 'trainingId is required' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const training = await Training.findById(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    if (company.assignedTrainings.includes(trainingId)) {
      return res.status(409).json({ message: 'Training already assigned to this company' });
    }

    company.assignedTrainings.push(trainingId);
    await company.save();

    res.json({ message: `"${training.title}" assigned to ${company.companyName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Remove Single Training from Company ─────────────────────────────────────

exports.removeTraining = async (req, res) => {
  try {
    const { trainingId } = req.params;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const before = company.assignedTrainings.length;
    company.assignedTrainings = company.assignedTrainings.filter(
      (id) => id.toString() !== trainingId
    );

    if (company.assignedTrainings.length === before) {
      return res.status(404).json({ message: 'Training not assigned to this company' });
    }

    await company.save();

    res.json({ message: 'Training removed from company successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};