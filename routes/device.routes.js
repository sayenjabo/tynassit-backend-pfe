const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect, companyOnly } = require('../middleware/auth.middleware');

// ─── Routes publiques (appelées par l'app Unity) ──────────────────────────────

// Étape 1 — Casque envoie son Meta User ID → reçoit code d'activation
router.post('/request-activation', deviceController.requestActivation);

// Vérifier si le casque est déjà activé au démarrage
router.post('/check', deviceController.checkDevice);

// ─── Routes protégées (appelées par le dashboard entreprise) ──────────────────

router.use(protect, companyOnly);

// Étape 2 — Admin entre le code d'activation → casque activé
router.post('/activate', deviceController.activateDevice);

// Lister tous les casques de l'entreprise
router.get('/', deviceController.getMyDevices);

// Mettre à jour le label d'un casque
router.patch('/:id', deviceController.updateDevice);

// Révoquer un casque (transfert ou perte)
router.delete('/:id', deviceController.revokeDevice);

module.exports = router;
