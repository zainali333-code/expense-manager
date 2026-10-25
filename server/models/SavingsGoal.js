const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Goal name is required'], trim: true },
    targetAmount: { type: Number, required: true, min: [1, 'Target must be greater than 0'] },
    savedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavingsGoal', goalSchema);
