const mongoose = require('mongoose');

const sessionCounterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // null = guest session
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ─── One counter per (company, training, employee) triple ────────────────────
// Partial index handles null employee for guest sessions.
sessionCounterSchema.index(
  { company: 1, training: 1, employee: 1 },
  { unique: true }
);

module.exports = mongoose.model('SessionCounter', sessionCounterSchema);