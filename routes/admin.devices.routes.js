const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect, adminOnly);

// Activer un casque pour n'importe quelle entreprise
router.post('/activate', deviceController.adminActivateDevice);

// Tous les casques (filtrable par ?companyId=)
router.get('/', deviceController.getAllDevices);

// Révoquer n'importe quel casque
router.delete('/:id', deviceController.adminRevokeDevice);

module.exports = router;
