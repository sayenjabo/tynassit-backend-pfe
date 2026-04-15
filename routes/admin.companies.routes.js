const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/admin.companies.controller');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth.middleware');

// All routes below require a valid admin token
router.use(protect, adminOnly);

// ─── CRUD ─────────────────────────────────────────────────────────────────────

router.get('/', companiesController.getAll);
router.get('/:id', companiesController.getOne);
router.post('/', companiesController.create);
router.patch('/:id', companiesController.update);
router.delete('/:id', superAdminOnly, companiesController.remove); // superadmin only

// ─── Training Assignment ──────────────────────────────────────────────────────

router.put('/:id/trainings', companiesController.assignTrainings);       // replace full list
router.post('/:id/trainings', companiesController.addTraining);          // add one
router.delete('/:id/trainings/:trainingId', companiesController.removeTraining); // remove one

module.exports = router;