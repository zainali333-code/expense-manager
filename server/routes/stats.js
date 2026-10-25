const router = require('express').Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth);

const nowMonth = () => new Date().toISOString().slice(0, 7);
const validMonth = (m) => (/^\d{4}-\d{2}$/.test(m || '') ? m : nowMonth());
const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
};
const prevMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
};
const change = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 100) : null);

async function totals(userId, from, to) {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (from) match.date = { $gte: from, $lt: to };
  const rows = await Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);
  const out = { income: 0, expense: 0 };
  rows.forEach((r) => (out[r._id] = r.total));
  return out;
}

// Dashboard cards: month income/expense, all-time balance, change vs previous month
router.get(
  '/summary',
  wrap(async (req, res) => {
    const month = validMonth(req.query.month);
    const [from, to] = monthRange(month);
    const [pFrom, pTo] = monthRange(prevMonth(month));
    const [cur, prev, all] = await Promise.all([totals(req.user, from, to), totals(req.user, pFrom, pTo), totals(req.user)]);
    res.json({
      month,
      income: cur.income,
      expense: cur.expense,
      saved: cur.income - cur.expense,
      balance: all.income - all.expense,
      incomeChange: change(cur.income, prev.income),
      expenseChange: change(cur.expense, prev.expense),
    });
  })
);

// Income vs expense per month for a year
router.get(
  '/monthly',
  wrap(async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getUTCFullYear();
    const rows = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user),
          date: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) },
        },
      },
      { $group: { _id: { m: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]);
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = names.map((month) => ({ month, income: 0, expense: 0 }));
    rows.forEach((r) => (data[r._id.m - 1][r._id.type] = r.total));
    res.json(data);
  })
);

// Category-wise totals for a month (default: expenses)
router.get(
  '/categories',
  wrap(async (req, res) => {
    const month = validMonth(req.query.month);
    const [from, to] = monthRange(month);
    const type = req.query.type === 'income' ? 'income' : 'expense';
    const rows = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user), type, date: { $gte: from, $lt: to } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ category: r._id, total: r.total })));
  })
);

module.exports = router;
