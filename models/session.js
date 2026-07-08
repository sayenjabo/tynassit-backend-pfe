const mongoose = require('mongoose');

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    criteriaName: { type: String, required: true, trim: true },
    passed: { type: Boolean, required: true },
    score: { type: Number, min: 0, max: 100, default: null },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
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

    // FIX #4 — link session to the specific employee who did it
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // optional for now — null = submitted without employee login
    },

    // ─── Timing ───────────────────────────────────────────────────────────────
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },

    // ─── Result ───────────────────────────────────────────────────────────────
    score: { type: Number, min: 0, max: 100, required: true },
    passed: { type: Boolean, required: true },
    attemptNumber: { type: Number, default: 1 },

    // ─── Evaluation Criteria ──────────────────────────────────────────────────
    evaluationCriteria: { type: [evaluationCriteriaSchema], default: [] },

    notes: { type: String, default: null },
  },
  { timestamps: true }
);

// Auto-calculate attemptNumber — scoped per employee if present, else per company
sessionSchema.pre('save', async function () {
  if (this.isNew) {
    const filter = this.employee
      ? { employee: this.employee, training: this.training }
      : { company: this.company, training: this.training };

    const count = await mongoose.model('Session').countDocuments(filter);
    this.attemptNumber = count + 1;
  }
});

module.exports = mongoose.model('Session', sessionSchema);
