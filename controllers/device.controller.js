const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Device = require('../models/device');

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateActivationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres

// ─── Étape 1 — Le casque s'enregistre et demande un code d'activation ─────────
// Appelé automatiquement par l'app Unity au premier démarrage
// Le casque envoie son Meta User ID → reçoit un code à afficher à l'écran

exports.requestActivation = async (req, res) => {
  try {
    const { metaUserId } = req.body;

    if (!metaUserId) {
      return res.status(400).json({ message: 'Meta User ID is required' });
    }

    // Vérifier si le casque est déjà activé
    const existing = await Device.findOne({ metaUserId });

    if (existing && existing.isActive) {
      return res.status(200).json({
        status: 'already_activated',
        message: 'Device already activated',
        companyId: existing.company,
      });
    }

    // Générer un code d'activation valable 15 minutes
    const activationCode = generateActivationCode();
    const activationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Créer ou mettre à jour le device
    const device = await Device.findOneAndUpdate(
      { metaUserId },
      {
        metaUserId,
        activationCode,
        activationCodeExpires,
        isActive: false,
        company: null,
        deviceToken: null,
      },
      { new: true, upsert: true }
    );

    res.json({
      status: 'pending_activation',
      activationCode: device.activationCode,
      expiresIn: '15 minutes',
      message: 'Show this code to your company admin',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Étape 2 — L'admin entre le code depuis le dashboard ─────────────────────
// Protégé par token company — seule l'entreprise peut activer ses propres casques

exports.activateDevice = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { activationCode, label } = req.body;

    if (!activationCode) {
      return res.status(400).json({ message: 'Activation code is required' });
    }

    const device = await Device.findOne({ activationCode });

    if (!device) {
      return res.status(404).json({ message: 'Invalid activation code' });
    }

    if (device.isActive) {
      return res.status(400).json({ message: 'Device is already activated' });
    }

    if (device.activationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Activation code has expired — ask the device to generate a new one' });
    }

    // Générer un token JWT longue durée pour le casque (1 an)
    const deviceToken = jwt.sign(
      { id: companyId, type: 'device', metaUserId: device.metaUserId },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    // Stocker le hash du token — jamais le token brut
    const hashedToken = crypto.createHash('sha256').update(deviceToken).digest('hex');

    device.company = companyId;
    device.label = label || `Casque ${device.metaUserId.substring(0, 6)}`;
    device.deviceToken = hashedToken;
    device.isActive = true;
    device.activatedAt = new Date();
    device.activationCode = null; // invalider le code après usage
    device.activationCodeExpires = null;
    await device.save();

    res.json({
      message: 'Device activated successfully',
      device: {
        id: device._id,
        label: device.label,
        metaUserId: device.metaUserId,
        activatedAt: device.activatedAt,
      },
      // Ce token est retourné UNE SEULE FOIS — l'app Unity doit le stocker
      deviceToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Vérifier si le casque est activé (appelé par Unity au démarrage) ─────────

exports.checkDevice = async (req, res) => {
  try {
    const { metaUserId } = req.body;

    if (!metaUserId) {
      return res.status(400).json({ message: 'Meta User ID is required' });
    }

    const device = await Device.findOne({ metaUserId }).populate('company', 'companyName isActive');

    if (!device || !device.isActive) {
      return res.status(404).json({
        status: 'not_activated',
        message: 'Device not activated',
      });
    }

    if (!device.company || !device.company.isActive) {
      return res.status(403).json({
        status: 'suspended',
        message: 'Company access has been suspended',
      });
    }

    res.json({
      status: 'activated',
      company: {
        id: device.company._id,
        companyName: device.company.companyName,
      },
      label: device.label,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Révoquer un casque (admin) ───────────────────────────────────────────────

exports.revokeDevice = async (req, res) => {
  try {
    const companyId = req.user.id;

    const device = await Device.findOne({ _id: req.params.id, company: companyId });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    device.revokedAt = new Date();
    device.deviceToken = null;
    device.company = null;
    await device.save();

    res.json({ message: 'Device revoked successfully — it will need to be reactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Lister les casques de l'entreprise (admin) ───────────────────────────────

exports.getMyDevices = async (req, res) => {
  try {
    const companyId = req.user.id;

    const devices = await Device.find({ company: companyId }).select('-deviceToken -activationCode');

    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mettre à jour le label d'un casque ──────────────────────────────────────

exports.updateDevice = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { label } = req.body;

    const device = await Device.findOne({ _id: req.params.id, company: companyId });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (label) device.label = label;
    await device.save();

    res.json({ message: 'Device updated', device: { id: device._id, label: device.label } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin — Voir tous les casques ────────────────────────────────────────────

exports.getAllDevices = async (req, res) => {
  try {
    const { companyId } = req.query; // filtre optionnel ?companyId=...

    const filter = {};
    if (companyId) filter.company = companyId;

    const devices = await Device.find(filter)
      .select('-deviceToken -activationCode')
      .populate('company', 'companyName email')
      .sort({ createdAt: -1 });

    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin — Révoquer n'importe quel casque ───────────────────────────────────

exports.adminRevokeDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    device.revokedAt = new Date();
    device.deviceToken = null;
    device.company = null;
    await device.save();

    res.json({ message: 'Device revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
