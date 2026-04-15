const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/Session.controller');
const { protect, companyOnly, adminOnly } = require('../middleware/auth.middleware');

// ─── Quest App Routes ─────────────────────────────────────────────────────────

// Submit a completed session (called by Quest app after training ends)
router.post('/submit', protect, companyOnly, sessionController.submitSession);

// Get company's own session history
router.get('/my', protect, companyOnly, sessionController.getMySessions);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// Get all sessions (filterable by ?companyId=&trainingId=)
router.get('/', protect, adminOnly, sessionController.getAllSessions);

// Stats per training (for upgrading training content)
router.get('/stats/trainings', protect, adminOnly, sessionController.statsByTraining);

// Stats per company (for monitoring activity)
router.get('/stats/companies', protect, adminOnly, sessionController.statsByCompany);

// Full breakdown for one specific company
router.get('/stats/companies/:id', protect, adminOnly, sessionController.statsOneCompany);

module.exports = router;