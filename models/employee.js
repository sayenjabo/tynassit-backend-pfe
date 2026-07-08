const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      enum: ['training', 'task'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    module: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    // ─── Belongs to ───────────────────────────────────────────────────────────
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // ─── Info ─────────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── VR Access Code: format XX-001 ────────────────────────────────────────
    // XX  = 2-letter prefix from company name
    // 001 = auto-incremented per company
    accessCode: {
      type: String,
      unique: true,
      required: true,
    },

    // ─── PIN (bcrypt hashed) ──────────────────────────────────────────────────
    // 4-digit PIN set by the company — never stored in plain text
    pin: {
      type: String,
      required: [true, 'PIN is required'],
    },

    // ─── Milestones ───────────────────────────────────────────────────────────
    milestones: {
      type: [milestoneSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
