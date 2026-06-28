const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const Store = require('../models/Store');
const { auth } = require('../middleware/auth');

// Get all franchises for current user
router.get('/', auth, async (req, res) => {
  try {
    const owned = await Franchise.find({ brandOwner: req.user._id })
      .populate('franchisee', 'username level')
      .populate('franchiseStore', 'name districtType stats.rating');
    const joined = await Franchise.find({ franchisee: req.user._id })
      .populate('brandOwner', 'username level')
      .populate('brandStore', 'name districtType');
    res.json({ owned, joined });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request franchise
router.post('/request', auth, async (req, res) => {
  try {
    const { brandStoreId, revenueShare, fixedFee, feePeriod } = req.body;

    const brandStore = await Store.findById(brandStoreId);
    if (!brandStore) return res.status(404).json({ error: 'Store not found' });

    if (req.user.level < 15) {
      return res.status(403).json({ error: 'Level 15 required for franchises' });
    }

    // Create franchise store with same name
    const franchiseStore = new Store({
      name: `${brandStore.name} (Franquicia)`,
      owner: req.user._id,
      districtType: req.body.districtType || 'ciudad',
      districtName: req.body.districtName || 'Ciudad',
      isFranchise: true,
      franchiseOf: brandStore._id
    });
    await franchiseStore.save();

    const franchise = new Franchise({
      brandStore: brandStore._id,
      brandOwner: brandStore.owner,
      franchisee: req.user._id,
      franchiseStore: franchiseStore._id,
      status: 'pending',
      contractTerms: {
        revenueShare: revenueShare || 5,
        fixedFee: fixedFee || 0,
        feePeriod: feePeriod || 'monthly',
        duration: 12,
        autoRenew: false
      }
    });
    await franchise.save();

    req.user.storeIds.push(franchiseStore._id);
    await req.user.save();

    res.status(201).json({ franchise });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve/reject franchise
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    if (!franchise) return res.status(404).json({ error: 'Franchise not found' });
    if (franchise.brandOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    franchise.status = 'approved';
    franchise.tier = 'bronze';
    await franchise.save();

    const store = await Store.findById(franchise.franchiseStore);
    if (store) {
      store.isOpen = true;
      store.upgrades = {
        ...store.upgrades,
        deliveryService: store.upgrades.deliveryService
      };
      await store.save();
    }

    res.json({ franchise });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
