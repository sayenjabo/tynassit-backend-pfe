// models/quizResult.js
const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company',  required: true },
  training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  quiz:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',     required: true },

  score:         { type: Number, required: true, min: 0, max: 100 },
  passed:        { type: Boolean, required: true },
  correctCount:  { type: Number, required: true },
  totalQuestions:{ type: Number, required: true },
  passingScore:  { type: Number, required: true },

  // Consumed when the session is saved — prevents reuse
  consumed:  { type: Boolean, default: false },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
}, { timestamps: true });

module.exports = mongoose.model('QuizResult', quizResultSchema);