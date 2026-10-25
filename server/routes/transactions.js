const router = require('express').Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildFilter(req) {
  const q = req.query;
  const f = { user: req.user };
  if (['income', 'expense'].includes(q.type)) f.type = q.type;
  if (q.category) f.category = q.category;
  if (q.method) f.paymentMethod = q.method;
  if (q.search) f.title = { $regex: esc(String(q.search)), $options: 'i' };
  if (q.from || q.to) {
    f.date = {};
    if (q.from) f.date.$gte = new Date(q.from);
    if (q.to) {
      const d = new Date(q.to);
      d.setUTCDate(d.getUTCDate() + 1);
      f.date.$lt = d;
    }
  }
  return f;
}

const pick = (b) => ({
  type: b.type,
  title: b.title,
  amount: b.amount,
  category: b.category,
  paymentMethod: b.paymentMethod,
  date: b.date,
  note: b.note,
});

router.get(
  '/',
  wrap(async (req, res) => {
    const filter = buildFilter(req);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const sortDir = req.query.sort === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: sortDir, createdAt: sortDir })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.get(
  '/export',
  wrap(async (req, res) => {
    const items = await Transaction.find(buildFilter(req)).sort({ date: -1 });
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Date', 'Type', 'Title', 'Category', 'Payment Method', 'Amount', 'Note']];
    items.forEach((t) =>
      rows.push([t.date.toISOString().slice(0, 10), t.type, t.title, t.category, t.paymentMethod, t.amount, t.note])
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(rows.map((r) => r.map(cell).join(',')).join('\n'));
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const t = await Transaction.create({ ...pick(req.body), user: req.user });
    res.status(201).json(t);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    const t = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user }, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!t) return res.status(404).json({ message: 'Transaction not found' });
    res.json(t);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const t = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!t) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted' });
  })
);

module.exports = router;
