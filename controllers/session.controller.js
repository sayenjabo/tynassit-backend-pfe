const Session = require('../models/session');
const Company = require('../models/company');
const Training = require('../models/training');
const Employee = require('../models/employee');

// ─── Submit Session (Quest app) ───────────────────────────────────────────────

exports.submitSession = async (req, res) => {
  try {
    const companyId = req.user.id;

    const {
      trainingId,
      employeeId, // FIX #4 — now accepted from Quest app
      startedAt,
      completedAt,
      score,
      passed,
      evaluationCriteria,
      notes,
    } = req.body;

    if (!trainingId || !startedAt || !completedAt || score === undefined || passed === undefined) {
      return res.status(400).json({
        message: 'trainingId, startedAt, completedAt, score and passed are required',
      });
    }

    // Verify training is assigned to this company
    const company = await Company.findById(companyId);
    const isAssigned = company.assignedTrainings.some(
      (id) => id.toString() === trainingId
    );
    if (!isAssigned) {
      return res.status(403).json({ message: 'This training is not assigned to your company' });
    }

    // Verify training exists
    const training = await Training.findById(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    // FIX #4 — if employeeId provided, verify they belong to this company
    if (employeeId) {
      const employee = await Employee.findOne({ _id: employeeId, company: companyId });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found or does not belong to your company' });
      }
    }

    // Calculate duration
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationSeconds = Math.round((end - start) / 1000);

    if (durationSeconds <= 0) {
      return res.status(400).json({ message: 'completedAt must be after startedAt' });
    }

    const session = await Session.create({
      company: companyId,
      training: trainingId,
      employee: employeeId || null, // FIX #4
      startedAt: start,
      completedAt: end,
      durationSeconds,
      score,
      passed,
      evaluationCriteria: evaluationCriteria || [],
      notes: notes || null,
    });

    // FIX #4 — auto-update the matching training milestone to 'completed'
    if (employeeId && passed) {
      const employee = await Employee.findById(employeeId);
      if (employee) {
        const milestone = employee.milestones.find(
          (m) =>
            m.type === 'training' &&
            m.module === training.title &&
            m.status !== 'completed'
        );
        if (milestone) {
          milestone.status = 'completed';
          milestone.score = score;
          milestone.completedAt = end;
          await employee.save();
        }
      }
    }

    res.status(201).json({ message: 'Session saved successfully', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Company's Own Sessions ───────────────────────────────────────────────

exports.getMySessions = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { trainingId, employeeId } = req.query;

    const filter = { company: companyId };
    if (trainingId) filter.training = trainingId;
    if (employeeId) filter.employee = employeeId;

    const sessions = await Session.find(filter)
      .populate('training', 'title category')
      .populate('employee', 'name accessCode department')
      .sort({ completedAt: -1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Sessions (Admin) ─────────────────────────────────────────────────

exports.getAllSessions = async (req, res) => {
  try {
    const { companyId, trainingId, employeeId } = req.query;

    const filter = {};
    if (companyId) filter.company = companyId;
    if (trainingId) filter.training = trainingId;
    if (employeeId) filter.employee = employeeId;

    const sessions = await Session.find(filter)
      .populate('company', 'companyName email')
      .populate('training', 'title category')
      .populate('employee', 'name accessCode department')
      .sort({ completedAt: -1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stats per Training (Admin) ───────────────────────────────────────────────

exports.statsByTraining = async (req, res) => {
  try {
    const stats = await Session.aggregate([
      {
        $group: {
          _id: '$training',
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgDurationSeconds: { $avg: '$durationSeconds' },
          passCount: { $sum: { $cond: ['$passed', 1, 0] } },
          failCount: { $sum: { $cond: ['$passed', 0, 1] } },
        },
      },
      {
        $lookup: {
          from: 'trainings',
          localField: '_id',
          foreignField: '_id',
          as: 'training',
        },
      },
      { $unwind: '$training' },
      {
        $project: {
          _id: 0,
          trainingId: '$_id',
          title: '$training.title',
          category: '$training.category',
          totalSessions: 1,
          avgScore: { $round: ['$avgScore', 1] },
          avgDurationSeconds: { $round: ['$avgDurationSeconds', 0] },
          passCount: 1,
          failCount: 1,
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalSessions'] }, 100] },
              1,
            ],
          },
        },
      },
      { $sort: { totalSessions: -1 } },
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stats per Company (Admin) ────────────────────────────────────────────────

exports.statsByCompany = async (req, res) => {
  try {
    const stats = await Session.aggregate([
      {
        $group: {
          _id: '$company',
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgDurationSeconds: { $avg: '$durationSeconds' },
          passCount: { $sum: { $cond: ['$passed', 1, 0] } },
          failCount: { $sum: { $cond: ['$passed', 0, 1] } },
          lastActivity: { $max: '$completedAt' },
          trainingsUsed: { $addToSet: '$training' },
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $project: {
          _id: 0,
          companyId: '$_id',
          companyName: '$company.companyName',
          email: '$company.email',
          totalSessions: 1,
          avgScore: { $round: ['$avgScore', 1] },
          avgDurationSeconds: { $round: ['$avgDurationSeconds', 0] },
          passCount: 1,
          failCount: 1,
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalSessions'] }, 100] },
              1,
            ],
          },
          lastActivity: 1,
          uniqueTrainingsUsed: { $size: '$trainingsUsed' },
        },
      },
      { $sort: { lastActivity: -1 } },
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stats for one specific Company (Admin) ───────────────────────────────────

exports.statsOneCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).select('companyName email');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const breakdown = await Session.aggregate([
      { $match: { company: company._id } },
      {
        $group: {
          _id: '$training',
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgDurationSeconds: { $avg: '$durationSeconds' },
          passCount: { $sum: { $cond: ['$passed', 1, 0] } },
          failCount: { $sum: { $cond: ['$passed', 0, 1] } },
          lastAttempt: { $max: '$completedAt' },
        },
      },
      {
        $lookup: {
          from: 'trainings',
          localField: '_id',
          foreignField: '_id',
          as: 'training',
        },
      },
      { $unwind: '$training' },
      {
        $project: {
          _id: 0,
          trainingId: '$_id',
          title: '$training.title',
          category: '$training.category',
          totalSessions: 1,
          avgScore: { $round: ['$avgScore', 1] },
          avgDurationSeconds: { $round: ['$avgDurationSeconds', 0] },
          passCount: 1,
          failCount: 1,
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalSessions'] }, 100] },
              1,
            ],
          },
          lastAttempt: 1,
        },
      },
      { $sort: { lastAttempt: -1 } },
    ]);

    res.json({
      company: { id: company._id, companyName: company.companyName, email: company.email },
      breakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
