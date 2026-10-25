const router = require('express').Router();
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth);

const nowMonth = () => new Date().toISOString().slice(0, 7);
const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
};

const statusOf = (percent) => {
  if (percent > 100) return 'Exceeded';
  if (percent === 100) return 'Limit Reached';
  if (percent >= 75) return 'Near Limit';
  return 'Safe';
};

router.get(
  '/',
  wrap(async (req, res) => {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : nowMonth();
    const [from, to] = monthRange(month);
    const [budgets, spentRows] = await Promise.all([
      Budget.find({ user: req.user, month }).sort({ category: 1 }).lean(),
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user), type: 'expense', date: { $gte: from, $lt: to } } },
        { $group: { _id: '$category', spent: { $sum: '$amount' } } },
      ]),
    ]);
    const spentMap = Object.fromEntries(spentRows.map((r) => [r._id, r.spent]));
    res.json(
      budgets.map((b) => {
        const spent = spentMap[b.category] || 0;
        const percent = Math.round((spent / b.limit) * 1000) / 10;
        return { ...b, spent, percent, status: statusOf(percent) };
      })
    );
  })
);

// Create or update (upsert) a budget for category + month
router.post(
  '/',
  wrap(async (req, res) => {
    const { category, limit, month } = req.body;
    const m = month || nowMonth();
    const budget = await Budget.findOneAndUpdate(
      { user: req.user, category, month: m },
      { limit },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(budget);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    const b = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.user }, { limit: req.body.limit }, { new: true, runValidators: true });
    if (!b) return res.status(404).json({ message: 'Budget not found' });
    res.json(b);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!b) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Deleted' });
  })
);

module.exports = router;
