const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const { deviceOnly } = require('../middleware/auth.middleware');

// ─── GET /api/company/devices/sessions/last ───────────────────────────────────
// Retourne la dernière session d'un employé pour une formation donnée
// Utilisé par Unity pour afficher le score précédent avant de relancer
// Query : ?trainingId=xxx&employeeId=xxx
// Auth  : device_token (deviceOnly)

router.get('/last', deviceOnly, async (req, res) => {
  try {
    const companyId = req.user.id; // extrait du token casque
    const { trainingId, employeeId } = req.query;

    if (!trainingId || !employeeId) {
      return res.status(400).json({ message: 'trainingId and employeeId are required' });
    }

    const session = await Session.findOne({
      training: trainingId,
      employee: employeeId,
      company: companyId, // sécurité : scoped à l'entreprise du casque
    })
      .sort({ completedAt: -1 })
      .select('score passed attemptNumber completedAt durationSeconds');

    if (!session) {
      return res.json({ session: null }); // première tentative — pas d'historique
    }

    res.json({
      session: {
        score: session.score,
        passed: session.passed,
        attemptNumber: session.attemptNumber,
        completedAt: session.completedAt,
        durationSeconds: session.durationSeconds,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
