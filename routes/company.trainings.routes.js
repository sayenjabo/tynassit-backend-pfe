const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const { protect, companyOnly } = require('../middleware/auth.middleware');

// ─── GET /api/company/trainings ───────────────────────────────────────────────
// Retourne les formations actives assignées à la company connectée
// Utilisé par le dashboard company — page Trainings

router.get('/', protect, companyOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id)
      .populate('assignedTrainings');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const trainings = company.assignedTrainings.filter((t) => t.isActive);

    res.json({ trainings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
