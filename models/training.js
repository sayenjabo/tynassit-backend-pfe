const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // e.g. 'Customs Inspection', 'Electrician', 'Fire Safety', etc.
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true, // Tynass can hide a training without deleting it
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Training', trainingSchema);