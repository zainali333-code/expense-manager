const router = require('express').Router();
const Goal = require('../models/SavingsGoal');
const auth = require('../middleware/auth');
const wrap = require('../utils/wrap');

router.use(auth);

router.get(
  '/',
  wrap(async (req, res) => {
    res.json(await Goal.find({ user: req.user }).sort({ createdAt: -1 }));
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const { name, targetAmount, savedAmount, deadline } = req.body;
    const g = await Goal.create({ user: req.user, name, targetAmount, savedAmount, deadline: deadline || undefined });
    res.status(201).json(g);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    const { name, targetAmount, savedAmount, deadline } = req.body;
    const g = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      { name, targetAmount, savedAmount, deadline: deadline || undefined },
      { new: true, runValidators: true }
    );
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    res.json(g);
  })
);

// Add money to a goal
router.post(
  '/:id/add',
  wrap(async (req, res) => {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });
    const g = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user }, { $inc: { savedAmount: amount } }, { new: true });
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    res.json(g);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const g = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Deleted' });
  })
);

module.exports = router;
