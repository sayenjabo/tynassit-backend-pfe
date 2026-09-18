const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin.auth.controller');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth.middleware');
// ─── Public ───────────────────────────────────────────────────────────────────

router.post('/login', adminAuthController.login);
router.post('/logout', adminAuthController.logout);

// ─── Protected ────────────────────────────────────────────────────────────────

router.get('/me', protect, adminAuthController.me);

// ─── Staff management (superadmin only) ───────────────────────────────────────

router.get('/staff', protect, adminOnly, superAdminOnly, adminAuthController.getStaff);
router.post('/staff', protect, adminOnly, superAdminOnly, adminAuthController.createStaff);
router.patch('/staff/:id', protect, adminOnly, superAdminOnly, adminAuthController.updateStaff);
router.delete('/staff/:id', protect, adminOnly, superAdminOnly, adminAuthController.deleteStaff);

// ─── FIX #3 — /setup is DISABLED ─────────────────────────────────────────────
// router.post('/setup', adminAuthController.createSuperAdmin); // ← DISABLED

module.exports = router;
