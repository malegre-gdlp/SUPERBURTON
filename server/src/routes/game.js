const express = require('express');
const router = express.Router();
const GameState = require('../models/GameState');
const Store = require('../models/Store');
const User = require('../models/User');
const economyEngine = require('../services/EconomyEngine');
const { auth } = require('../middleware/auth');

// Get global game state
router.get('/state', async (req, res) => {
  try {
    let state = await GameState.findOne({ key: 'global' });
    if (!state) {
      state = await GameState.create({ key: 'global', day: 1 });
    }
    // Format time as HH:MM
    const hourStr = String(state.hour).padStart(2, '0');
    const minStr = String(state.minute).padStart(2, '0');
    res.json({
      day: state.day,
      hour: state.hour,
      minute: state.minute,
      timeString: `${hourStr}:${minStr}`,
      season: state.season,
      weather: state.weather,
      lastTick: state.lastTick,
      tickCount: state.tickCount,
      totalStoresEver: state.totalStoresEver,
      totalRevenueEver: state.totalRevenueEver,
      totalCustomersEver: state.totalCustomersEver
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Global tick — processes ALL open stores and advances time
router.post('/tick', async (req, res) => {
  try {
    let gameState = await GameState.findOne({ key: 'global' });
    if (!gameState) gameState = await GameState.create({ key: 'global', day: 1 });

    const openStores = await Store.find({ isOpen: true }).populate('owner');
    const results = [];
    let totalCustomers = 0, totalRevenue = 0;

    for (const store of openStores) {
      const result = await economyEngine.processStoreTick(store);
      if (result && result.totalProfit > 0) {
        const owner = await User.findById(store.owner);
        if (owner) {
          owner.money += result.totalProfit;
          owner.stats.totalProfit += result.totalProfit;
          owner.stats.totalSales += result.totalSales;
          owner.stats.totalCustomers += result.customers;
          await owner.save();
        }
        totalCustomers += result.customers || 0;
        totalRevenue += result.totalRevenue || 0;
        results.push({
          storeId: store._id,
          storeName: store.name,
          customers: result.customers,
          revenue: result.totalRevenue,
          profit: result.totalProfit,
          sales: result.totalSales
        });
      }
    }

    // Advance time
    gameState.advanceTime();
    gameState.lastTick = new Date();
    gameState.tickCount += 1;
    gameState.totalCustomersEver += totalCustomers;
    gameState.totalRevenueEver += totalRevenue;
    gameState.totalStoresEver = Math.max(gameState.totalStoresEver, openStores.length);
    await gameState.save();

    const hourStr = String(gameState.hour).padStart(2, '0');
    const minStr = String(gameState.minute).padStart(2, '0');

    res.json({
      day: gameState.day,
      hour: gameState.hour,
      minute: gameState.minute,
      timeString: `${hourStr}:${minStr}`,
      season: gameState.season,
      weather: gameState.weather,
      storesProcessed: results.length,
      totalCustomers,
      totalRevenue,
      storeResults: results
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Ranking — top stores by revenue
router.get('/ranking', async (req, res) => {
  try {
    const topStores = await Store.find({})
      .sort({ 'stats.totalRevenue': -1 })
      .limit(20)
      .populate('owner', 'username level')
      .select('name districtType stats.totalRevenue stats.totalSales stats.totalCustomers stats.rating isOpen districtName');

    const ranking = topStores.map((s, i) => ({
      rank: i + 1,
      storeName: s.name,
      ownerName: s.owner?.username || 'Unknown',
      district: s.districtName,
      revenue: s.stats.totalRevenue,
      sales: s.stats.totalSales,
      customers: s.stats.totalCustomers,
      rating: s.stats.rating,
      isOpen: s.isOpen
    }));

    // Also get top players by money
    const topPlayers = await User.find({}).sort({ money: -1 }).limit(10).select('username level money reputation');

    res.json({ ranking, topPlayers });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
