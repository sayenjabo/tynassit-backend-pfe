const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { protect, companyOnly, adminOnly, deviceOnly } = require('../middleware/auth.middleware');

// ─── Quest App Routes ─────────────────────────────────────────────────────────

// Submit a completed session (called by Quest app — requires device token)
router.post('/submit', deviceOnly, sessionController.submitSession);

// Get company's own session history (called by company dashboard)
router.get('/my', protect, companyOnly, sessionController.getMySessions);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.get('/', protect, adminOnly, sessionController.getAllSessions);
router.get('/stats/trainings', protect, adminOnly, sessionController.statsByTraining);
router.get('/stats/companies', protect, adminOnly, sessionController.statsByCompany);
router.get('/stats/companies/:id', protect, adminOnly, sessionController.statsOneCompany);

module.exports = router;
