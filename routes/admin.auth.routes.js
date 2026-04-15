const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin.auth.controller');
const { protect, superAdminOnly } = require('../middleware/auth.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────

router.post('/login', adminAuthController.login);
router.post('/logout', adminAuthController.logout);

// ─── Protected ────────────────────────────────────────────────────────────────

router.get('/me', protect, adminAuthController.me);

// ─── Setup (run once to seed first superadmin, then disable) ──────────────────

router.post('/setup', adminAuthController.createSuperAdmin);

module.exports = router;