const mongoose = require('mongoose');

const choiceSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Choice text is required'],
      trim: true,
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    choices: {
      type: [choiceSchema],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 4,
        message: 'A question must have between 2 and 4 choices',
      },
    },
    // Stocké en DB mais jamais retourné au casque via GET /quiz
    // Retourné uniquement en interne pour la validation du submit
    correctIndex: {
      type: Number,
      required: [true, 'correctIndex is required'],
      min: 0,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    // ─── Lié à ────────────────────────────────────────────────────────────────
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // ─── Contenu ──────────────────────────────────────────────────────────────
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'A quiz must have at least one question',
      },
    },

    // ─── Seuil de réussite ────────────────────────────────────────────────────
    passingScore: {
      type: Number,
      default: 70, // 70% pour réussir
      min: 0,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

quizSchema.index(
  { training: 1, company: 1 },
  { unique: true }
);
module.exports = mongoose.model('Quiz', quizSchema);
