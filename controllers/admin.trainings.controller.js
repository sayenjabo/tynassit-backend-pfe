const Training = require('../models/training');

// ─── Get All Trainings ────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json({ trainings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get One Training ─────────────────────────────────────────────────────────

exports.getOne = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ training });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Create Training ──────────────────────────────────────────────────────────

exports.create = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    const training = await Training.create({ title, description, category, thumbnailUrl });

    res.status(201).json({
      message: 'Training created successfully',
      training,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Training ──────────────────────────────────────────────────────────

exports.update = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl, isActive } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    if (title !== undefined) training.title = title;
    if (description !== undefined) training.description = description;
    if (category !== undefined) training.category = category;
    if (thumbnailUrl !== undefined) training.thumbnailUrl = thumbnailUrl;
    if (isActive !== undefined) training.isActive = isActive;

    await training.save();

    res.json({ message: 'Training updated successfully', training });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Training ──────────────────────────────────────────────────────────

exports.remove = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};