const express = require('express');
const router = express.Router();
const trainingsController = require('../controllers/admin.trainings.controller');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth.middleware');

// All routes below require a valid admin token
router.use(protect, adminOnly);

// ─── CRUD ─────────────────────────────────────────────────────────────────────

router.get('/', trainingsController.getAll);
router.get('/:id', trainingsController.getOne);
router.post('/', trainingsController.create);
router.patch('/:id', trainingsController.update);
router.delete('/:id', superAdminOnly, trainingsController.remove); // superadmin only

module.exports = router;