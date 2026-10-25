const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    category: { type: String, required: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank', 'Card', 'Easypaisa', 'JazzCash'],
      default: 'Cash',
    },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
