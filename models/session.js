const mongoose = require('mongoose');

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    criteriaName: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Correct inspection procedure", "Identification of illegal items"
    },
    passed: {
      type: Boolean,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
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

    // ─── Timing ───────────────────────────────────────────────────────────────
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number, // calculated from startedAt → completedAt
      required: true,
    },

    // ─── Result ───────────────────────────────────────────────────────────────
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1, // incremented automatically based on previous sessions
    },

    // ─── Evaluation Criteria ──────────────────────────────────────────────────
    evaluationCriteria: {
      type: [evaluationCriteriaSchema],
      default: [],
    },

    // ─── Extra context ────────────────────────────────────────────────────────
    notes: {
      type: String,
      default: null,
      // Optional free-text from the Quest app (e.g. specific incidents)
    },
  },
  {
    timestamps: true,
  }
);

// ─── Auto-calculate attemptNumber before saving ───────────────────────────────
sessionSchema.pre('save', async function () {
  if (this.isNew) {
    const count = await mongoose.model('Session').countDocuments({
      company: this.company,
      training: this.training,
    });
    this.attemptNumber = count + 1;
  }
});

module.exports = mongoose.model('Session', sessionSchema);