const express = require('express');
const router = express.Router();
const economyEngine = require('../services/EconomyEngine');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { auth } = require('../middleware/auth');

// Seed database with products if empty
router.post('/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments({ isActive: true });
    if (count > 0) {
      return res.json({ message: `${count} products already exist`, count });
    }
    const seedData = require('../seed-data');
    const seeded = await Product.insertMany(
      seedData.products.map((p, i) => ({
        ...p,
        brand: seedData.brands[i % seedData.brands.length],
        isActive: true
      }))
    );
    res.json({ message: `${seeded.length} products seeded`, count: seeded.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Auto-tick all open stores (called by frontend periodically)
router.post('/auto-tick', async (req, res) => {
  try {
    const openStores = await Store.find({ isOpen: true }).limit(20);
    const results = [];
    for (const store of openStores) {
      const result = await economyEngine.processStoreTick(store);
      if (result) results.push({ storeId: store._id, ...result });
    }
    res.json({ ticks: results.length, results });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await economyEngine.getMarketOverview();
    res.json({ market: overview });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get wholesale price range for a product
router.get('/wholesale-range/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const range = economyEngine.calculateWholesalePriceRange(product);
    res.json({ range });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get retail price range for a product in a specific store
router.get('/retail-range/:productId/:storeId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    const store = await Store.findById(req.params.storeId);
    if (!product || !store) {
      return res.status(404).json({ error: 'Product or store not found' });
    }
    const range = economyEngine.calculateRetailPriceRange(product, store);
    res.json({ range, districtProfile: store.getDistrictProfile() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get district profiles
router.get('/districts', async (req, res) => {
  res.json({ districts: Store.DISTRICT_PROFILES });
});

// Validate a wholesale price
router.post('/validate-wholesale', auth, async (req, res) => {
  try {
    const { productId, proposedPrice } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const validation = economyEngine.validateWhiteLabelPrice(product, proposedPrice);
    res.json({ validation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validate a retail price
router.post('/validate-retail', auth, async (req, res) => {
  try {
    const { productId, storeId, proposedPrice } = req.body;
    const product = await Product.findById(productId);
    const store = await Store.findById(storeId);
    if (!product || !store) {
      return res.status(404).json({ error: 'Product or store not found' });
    }
    const validation = economyEngine.validateRetailPrice(product, store, proposedPrice);
    res.json({ validation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process a store tick (simulate customers)
router.post('/tick/:storeId', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const result = await economyEngine.processStoreTick(store);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update market competition (self-regulating economy)
router.post('/update-market', auth, async (req, res) => {
  try {
    const result = await economyEngine.updateMarketCompetition();
    res.json({ market: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
