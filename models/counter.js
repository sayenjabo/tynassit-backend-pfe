const mongoose = require('mongoose');

// Used to atomically generate sequential access codes per company
// e.g. key: "employee_<companyId>" → seq: 1, 2, 3 ...
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
