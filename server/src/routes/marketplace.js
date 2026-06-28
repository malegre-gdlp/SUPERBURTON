const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Get marketplace listings (products from other stores)
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find({ isOpen: true, isFranchise: false })
      .populate('owner', 'username')
      .select('name districtName owner stats.rating warehouse');

    const listings = [];
    for (const store of stores) {
      for (const item of store.warehouse) {
        if (item.quantity > 0) {
          const product = await Product.findById(item.productId);
          if (product) {
            listings.push({
              storeId: store._id,
              storeName: store.name,
              ownerName: store.owner?.username || 'Unknown',
              districtName: store.districtName,
              rating: store.stats.rating,
              productId: product._id,
              productName: product.name,
              brand: product.brand,
              quantity: item.quantity,
              price: item.purchasePrice,
              quality: product.quality
            });
          }
        }
      }
    }

    // Sort by price
    listings.sort((a, b) => a.price - b.price);

    res.json({ listings: listings.slice(0, 100) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Buy from marketplace
router.post('/buy', auth, async (req, res) => {
  try {
    const { productId, storeId, quantity } = req.body;

    const sellerStore = await Store.findById(storeId);
    if (!sellerStore) return res.status(404).json({ error: 'Store not found' });

    const warehouseItem = sellerStore.warehouse.find(
      w => w.productId.toString() === productId
    );
    if (!warehouseItem || warehouseItem.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const totalCost = warehouseItem.purchasePrice * quantity;

    if (req.user.money < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Transfer stock
    warehouseItem.quantity -= quantity;
    await sellerStore.save();

    // Add to buyer's active store
    const buyerStore = await Store.findById(req.user.activeStoreId);
    if (buyerStore) {
      const existingItem = buyerStore.warehouse.find(
        w => w.productId.toString() === productId
      );
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        buyerStore.warehouse.push({
          productId,
          quantity,
          purchasePrice: warehouseItem.purchasePrice
        });
      }
      await buyerStore.save();
    }

    // Transfer money
    req.user.money -= totalCost;
    await req.user.save();

    // Give money to seller (simplified - in production, credit the seller)
    const seller = await require('../models/User').findById(sellerStore.owner);
    if (seller) {
      seller.money += totalCost;
      await seller.save();
    }

    res.json({
      success: true,
      totalCost,
      remainingBalance: req.user.money
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
