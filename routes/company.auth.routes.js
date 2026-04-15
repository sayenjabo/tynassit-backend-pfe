const express = require('express');
const router = express.Router();
const companyAuthController = require('../controllers/company.auth.controller');
const { protect, companyOnly } = require('../middleware/auth.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────

router.post('/login', companyAuthController.login);
router.post('/logout', companyAuthController.logout);
router.post('/forgot', companyAuthController.forgotPassword);
router.post('/reset/:token', companyAuthController.resetPassword);

// ─── Protected ────────────────────────────────────────────────────────────────

router.get('/me', protect, companyOnly, companyAuthController.me);

module.exports = router;