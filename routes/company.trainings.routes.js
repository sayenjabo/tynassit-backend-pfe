const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const Quiz = require('../models/quiz');
const { protect, companyOnly } = require('../middleware/auth.middleware');

// ─── GET /api/company/trainings ───────────────────────────────────────────────
// Retourne les formations actives assignées à la company
// + hasQuiz : true si un quiz existe pour cette formation

router.get('/', protect, companyOnly, async (req, res) => {
  try {
    const companyId = req.user.id;

    const company = await Company.findById(companyId)
      .populate('assignedTrainings');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const activeTrainings = company.assignedTrainings.filter((t) => t.isActive);

    // Pour chaque formation, vérifier si un quiz existe
    const trainingsWithQuizStatus = await Promise.all(
      activeTrainings.map(async (training) => {
        const quiz = await Quiz.findOne({
          training: training._id,
          company: companyId,
        }).select('_id');

        return {
          ...training.toObject(),
          hasQuiz: !!quiz,
        };
      })
    );

    res.json({ trainings: trainingsWithQuizStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
