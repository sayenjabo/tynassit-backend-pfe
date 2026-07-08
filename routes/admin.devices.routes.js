const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect, adminOnly);

// Tous les casques (filtrable par ?companyId=)
router.get('/', deviceController.getAllDevices);

// Révoquer n'importe quel casque
router.delete('/:id', deviceController.adminRevokeDevice);

module.exports = router;
