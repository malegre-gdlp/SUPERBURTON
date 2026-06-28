const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const economyEngine = require('../services/EconomyEngine');
const { auth } = require('../middleware/auth');

// Get my white label products
router.get('/mine', auth, async (req, res) => {
  try {
    const products = await Product.find({
      isWhiteLabel: true,
      'whiteLabelDesign.ownerId': req.user._id
    });
    res.json({ products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Set wholesale price for white label product
router.post('/:id/set-price', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isWhiteLabel) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.whiteLabelDesign.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!product.whiteLabelDesign.approved) {
      return res.status(400).json({ error: 'Product not yet approved' });
    }

    const { wholesalePrice } = req.body;
    const validation = economyEngine.validateWhiteLabelPrice(product, wholesalePrice);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        allowedRange: validation.allowedRange
      });
    }

    product.wholesalePrice = wholesalePrice;
    product.basePrice = wholesalePrice * 1.3; // Suggested retail
    await product.save();

    res.json({ product, message: 'Precio actualizado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get royalty earnings
router.get('/royalties', auth, async (req, res) => {
  try {
    const products = await Product.find({
      isWhiteLabel: true,
      'whiteLabelDesign.ownerId': req.user._id,
      'whiteLabelDesign.approved': true
    });

    const totalRoyalties = products.reduce(
      (sum, p) => sum + (p.whiteLabelDesign.totalRoyaltiesEarned || 0), 0
    );

    res.json({
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        brandName: p.whiteLabelDesign.brandName,
        royaltyPercentage: p.whiteLabelDesign.royaltyPercentage,
        totalEarned: p.whiteLabelDesign.totalRoyaltiesEarned || 0
      })),
      totalRoyalties
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
