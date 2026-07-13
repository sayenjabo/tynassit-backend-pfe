const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    // ─── Identité du casque ───────────────────────────────────────────────────
    metaUserId: {
      type: String,
      required: [true, 'Meta User ID is required'],
      unique: true,
      trim: true,
    },

    // ─── Lien entreprise ─────────────────────────────────────────────────────
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null, // null = pas encore activé
    },

    // ─── Label lisible pour l'admin ──────────────────────────────────────────
    label: {
      type: String,
      trim: true,
      default: null, // ex: "Casque Salle A"
    },

    // ─── Code d'activation (affiché sur le casque, entré par l'admin) ────────
    activationCode: {
      type: String,
      default: null,
    },
    activationCodeExpires: {
      type: Date,
      default: null, // expire après 15 minutes
    },

    // ─── Token du casque (stocké dans l'app Unity) ────────────────────────────
    // On stocke un hash — jamais le token brut
    deviceToken: {
      type: String,
      default: null,
    },

    // ─── Token brut temporaire (60s) — récupéré par Unity via checkDevice ────
    // Effacé immédiatement après lecture
    deviceTokenPlain: {
      type: String,
      default: null,
    },
    deviceTokenPlainExpires: {
      type: Date,
      default: null,
    },

    // ─── Statut ───────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: false, // devient true après activation
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
