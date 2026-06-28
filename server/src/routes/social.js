const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Store = require('../models/Store');
const { auth } = require('../middleware/auth');

// Get online players
router.get('/players', auth, async (req, res) => {
  try {
    const players = await User.find()
      .select('username level reputation avatar')
      .limit(50);
    res.json({ players });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get rankings
router.get('/rankings', async (req, res) => {
  try {
    const { type = 'money', limit = 20 } = req.query;

    let sortField = { money: -1 };
    if (type === 'level') sortField = { level: -1 };
    if (type === 'reputation') sortField = { reputation: -1 };
    if (type === 'sales') sortField = { 'stats.totalSales': -1 };

    const players = await User.find()
      .select('username level money reputation stats')
      .sort(sortField)
      .limit(parseInt(limit));

    const storeRankings = await Store.find()
      .select('name owner stats.rating stats.totalRevenue districtType')
      .populate('owner', 'username')
      .sort({ 'stats.totalRevenue': -1 })
      .limit(parseInt(limit));

    res.json({ players, stores: storeRankings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get player profile by ID
router.get('/player/:id', async (req, res) => {
  try {
    const player = await User.findById(req.params.id)
      .select('username level reputation avatar stats');
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const stores = await Store.find({ owner: player._id })
      .select('name districtType stats.rating stats.totalRevenue isOpen');

    res.json({ player, stores });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
