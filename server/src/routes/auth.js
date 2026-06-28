const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        money: user.money
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        money: user.money,
        reputation: user.reputation,
        storeIds: user.storeIds
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      level: req.user.level,
      experience: req.user.experience,
      experienceToNextLevel: req.user.experienceToNextLevel,
      money: req.user.money,
      bankBalance: req.user.bankBalance,
      reputation: req.user.reputation,
      stats: req.user.stats,
      storeIds: req.user.storeIds,
      settings: req.user.settings
    }
  });
});

// Update profile
router.patch('/profile', auth, async (req, res) => {
  const updates = ['avatar', 'settings'];
  updates.forEach(field => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });
  await req.user.save();
  res.json({ user: req.user });
});

module.exports = router;
