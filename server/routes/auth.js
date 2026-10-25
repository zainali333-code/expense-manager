const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const wrap = require('../utils/wrap');

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'];
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, currency: u.currency, theme: u.theme });

router.post(
  '/register',
  wrap(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Valid email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(user._id), user: pub(user) });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: sign(user._id), user: pub(user) });
  })
);

router.get(
  '/me',
  auth,
  wrap(async (req, res) => {
    const user = await User.findById(req.user);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json(pub(user));
  })
);

router.put(
  '/profile',
  auth,
  wrap(async (req, res) => {
    const { name, currency, theme } = req.body;
    const update = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      update.name = name.trim();
    }
    if (currency !== undefined) {
      if (!CURRENCIES.includes(currency)) return res.status(400).json({ message: 'Unsupported currency' });
      update.currency = currency;
    }
    if (theme !== undefined) {
      if (!['light', 'dark'].includes(theme)) return res.status(400).json({ message: 'Invalid theme' });
      update.theme = theme;
    }
    const user = await User.findByIdAndUpdate(req.user, update, { new: true });
    res.json(pub(user));
  })
);

router.put(
  '/password',
  auth,
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user).select('+password');
    if (!(await bcrypt.compare(currentPassword || '', user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
