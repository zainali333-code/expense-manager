// Demo data: node seed.js  ->  login demo@example.com / demo123
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');
const Goal = require('./models/SavingsGoal');

const methods = ['Cash', 'Bank', 'Card', 'Easypaisa', 'JazzCash'];
const expenseItems = [
  ['Lunch', 'Food', 450, 1500], ['Groceries', 'Food', 2500, 6000], ['Uber ride', 'Transport', 300, 1200],
  ['Petrol', 'Transport', 2000, 4000], ['Electricity bill', 'Bills', 6000, 14000], ['Internet bill', 'Bills', 3000, 3500],
  ['New shoes', 'Shopping', 4000, 12000], ['Movie night', 'Entertainment', 800, 2500], ['Online course', 'Education', 1500, 8000],
  ['Netflix', 'Subscription', 1100, 1500],
];
const rand = (a, b) => Math.round(a + Math.random() * (b - a));
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteOne({ email: 'demo@example.com' });
  const user = await User.create({ name: 'Demo User', email: 'demo@example.com', password: await bcrypt.hash('demo123', 10) });

  const now = new Date();
  const tx = [];
  for (let back = 0; back < 7; back++) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - back;
    const day = (d) => new Date(Date.UTC(y, m, Math.min(d, back === 0 ? Math.max(now.getUTCDate(), 1) : 28)));
    tx.push({ type: 'income', title: 'Monthly salary', amount: rand(90000, 110000), category: 'Salary', paymentMethod: 'Bank', date: day(1) });
    tx.push({ type: 'income', title: 'Freelance project', amount: rand(15000, 45000), category: 'Freelance', paymentMethod: 'Easypaisa', date: day(10) });
    tx.push({ type: 'expense', title: 'House rent', amount: 35000, category: 'Rent', paymentMethod: 'Bank', date: day(2) });
    for (let i = 0; i < 14; i++) {
      const [title, category, lo, hi] = pickOne(expenseItems);
      tx.push({ type: 'expense', title, category, amount: rand(lo, hi), paymentMethod: pickOne(methods), date: day(rand(1, 28)) });
    }
  }
  await Transaction.insertMany(tx.map((t) => ({ ...t, user: user._id })));

  const month = now.toISOString().slice(0, 7);
  await Budget.insertMany(
    [['Food', 25000], ['Shopping', 15000], ['Bills', 20000], ['Transport', 10000], ['Entertainment', 5000]].map(([category, limit]) => ({
      user: user._id, category, limit, month,
    }))
  );
  await Goal.insertMany([
    { user: user._id, name: 'New Laptop', targetAmount: 250000, savedAmount: 90000, deadline: new Date(Date.UTC(now.getUTCFullYear() + 1, 2, 1)) },
    { user: user._id, name: 'Emergency Fund', targetAmount: 300000, savedAmount: 120000 },
  ]);

  console.log('Seeded: demo@example.com / demo123');
  await mongoose.disconnect();
})();
