const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { protect, companyOnly } = require('../middleware/auth.middleware');

// ─── VR Headset (public) ──────────────────────────────────────────────────────

// Employee logs in on the VR headset using their 6-digit code
router.post('/login', employeeController.loginWithCode);

// ─── Company Protected Routes ─────────────────────────────────────────────────

router.use(protect, companyOnly);

// Employee CRUD
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getMyEmployees);
router.get('/:id', employeeController.getEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Milestone routes
router.post('/:id/milestones', employeeController.addMilestone);
router.get('/:id/milestones', employeeController.getMilestones);
router.patch('/:id/milestones/:milestoneId', employeeController.updateMilestone);
router.delete('/:id/milestones/:milestoneId', employeeController.deleteMilestone);

module.exports = router;
