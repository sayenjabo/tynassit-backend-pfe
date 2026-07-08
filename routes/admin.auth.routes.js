const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin.auth.controller');
const { protect } = require('../middleware/auth.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────

router.post('/login', adminAuthController.login);
router.post('/logout', adminAuthController.logout);

// ─── Protected ────────────────────────────────────────────────────────────────

router.get('/me', protect, adminAuthController.me);

// ─── FIX #3 — /setup is DISABLED ─────────────────────────────────────────────
// Run it once manually via MongoDB Atlas or a seed script, then never again.
// router.post('/setup', adminAuthController.createSuperAdmin); // ← DISABLED

module.exports = router;
