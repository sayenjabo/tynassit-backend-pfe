const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { protect, companyOnly, deviceOnly } = require('../middleware/auth.middleware');

// ─── VR Headset — login employé (protégé par token casque) ───────────────────
// Le casque doit être activé pour pouvoir connecter un employé

router.post('/login', deviceOnly, employeeController.loginWithCode);

// ─── Dashboard entreprise — CRUD employés ─────────────────────────────────────

router.use(protect, companyOnly);

router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getMyEmployees);
router.get('/:id', employeeController.getEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Milestones
router.post('/:id/milestones', employeeController.addMilestone);
router.get('/:id/milestones', employeeController.getMilestones);
router.patch('/:id/milestones/:milestoneId', employeeController.updateMilestone);
router.delete('/:id/milestones/:milestoneId', employeeController.deleteMilestone);

module.exports = router;
