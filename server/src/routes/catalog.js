const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  const categories = [
    { id: 'alimentacion', name: 'Alimentación', icon: '🍎', count: 0 },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤', count: 0 },
    { id: 'limpieza', name: 'Limpieza', icon: '🧹', count: 0 },
    { id: 'mascotas', name: 'Mascotas', icon: '🐾', count: 0 },
    { id: 'electronica', name: 'Electrónica', icon: '💻', count: 0 },
    { id: 'jardineria', name: 'Jardinería', icon: '🌿', count: 0 },
    { id: 'farmacia', name: 'Farmacia', icon: '💊', count: 0 },
    { id: 'moda', name: 'Moda', icon: '👕', count: 0 },
    { id: 'juguetes', name: 'Juguetes', icon: '🎮', count: 0 }
  ];

  try {
    for (const cat of categories) {
      cat.count = await Product.countDocuments({ category: cat.id, isActive: true });
    }
  } catch (e) {
    // Ignore count errors
  }

  res.json({ categories });
});

// White label: Submit product design
router.post('/white-label', auth, async (req, res) => {
  try {
    const { name, description, category, brandName, logoUrl, imageUrl } = req.body;

    // Check store level instead of player level
    const Store = require('../models/Store');
    const store = await Store.findOne({ owner: req.user._id }).sort({ level: -1 });
    const storeLevel = store ? store.level : req.user.level;
    
    if (storeLevel < 5) {
      return res.status(403).json({
        error: `Necesitas nivel 5 de tienda para crear marca blanca (nivel actual: ${storeLevel})`
      });
    }

    const product = new Product({
      name,
      description,
      category,
      basePrice: 0.01,
      wholesalePrice: 0.01,
      isWhiteLabel: true,
      whiteLabelDesign: {
        ownerId: req.user._id,
        brandName,
        logoUrl,
        approved: false,
        royaltyPercentage: 5
      },
      imageUrl: imageUrl || 'white-label-default.png'
    });

    await product.save();

    res.status(201).json({
      product,
      message: 'Product submitted for review. It will be available once approved.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Moderate white label product (admin)
router.patch('/moderate/:id', auth, async (req, res) => {
  try {
    // Simple moderation - in production, use proper admin roles
    const product = await Product.findById(req.params.id);
    if (!product || !product.isWhiteLabel) {
      return res.status(404).json({ error: 'White label product not found' });
    }

    const { approved, moderationNote } = req.body;
    product.whiteLabelDesign.approved = approved;
    product.whiteLabelDesign.moderationNote = moderationNote;

    if (approved) {
      // Set base prices on approval
      product.basePrice = req.body.basePrice || 1.99;
      product.wholesalePrice = req.body.wholesalePrice || 1.50;
    }

    await product.save();
    res.json({ product, message: approved ? 'Product approved' : 'Product rejected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
