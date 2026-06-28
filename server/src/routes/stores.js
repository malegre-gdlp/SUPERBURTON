const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Fill warehouse with initial products for a new store
async function fillWarehouse(store) {
  try {
    const products = await Product.find({ isActive: true });
    for (const shelf of store.shelves) {
      if (shelf.type === 'checkout') continue;
      const catProducts = products.filter(p => p.category === shelf.category);
      const picked = catProducts.sort(() => Math.random() - 0.5).slice(0, Math.min(5, catProducts.length));
      for (const p of picked) {
        store.warehouse.push({
          productId: p._id,
          quantity: Math.floor(Math.random() * 100) + 80,
          minStock: 20,
          purchasePrice: p.wholesalePrice
        });
      }
    }
    await store.save();
  } catch (e) {
    console.error('Warehouse fill error:', e.message);
  }
}

// Restock shelves from warehouse (moves products with same category)
async function restockFromWarehouse(store) {
  // If warehouse is empty, fill it first
  const hasWarehouse = store.warehouse && store.warehouse.length > 0 && store.warehouse.some(w => w.quantity > 0);
  if (!hasWarehouse) {
    await fillWarehouse(store);
  }

  const products = await Product.find({ isActive: true }).select('_id category name');
  const productMap = {};
  for (const p of products) productMap[p._id.toString()] = p;

  let restocked = 0;
  for (const shelf of store.shelves) {
    if (shelf.type === 'checkout') continue;

    // Get warehouse items whose product category matches this shelf
    const matchingWarehouse = store.warehouse.filter(w => {
      const prod = productMap[w.productId.toString()];
      return prod && prod.category === shelf.category && w.quantity > 0;
    });

    for (const w of matchingWarehouse) {
      const existing = shelf.products.find(sp => sp.productId.toString() === w.productId.toString());
      const maxCap = existing ? existing.maxCapacity : 50;
      const currentQty = existing ? existing.quantity : 0;
      const spaceLeft = maxCap - currentQty;

      if (spaceLeft <= 0) continue;

      const toAdd = Math.min(w.quantity, spaceLeft, 25);
      if (toAdd <= 0) continue;

      if (existing) {
        existing.quantity += toAdd;
      } else {
        shelf.products.push({
          productId: w.productId,
          quantity: toAdd,
          maxCapacity: maxCap,
          price: Math.round(w.purchasePrice * 1.3 * 100) / 100
        });
      }
      w.quantity -= toAdd;
      restocked++;
    }
  }
  await store.save();
  return restocked;
}

// Create a new store
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, districtType, districtName } = req.body;

    const validDistricts = Object.keys(Store.DISTRICT_PROFILES);
    if (districtType && !validDistricts.includes(districtType)) {
      return res.status(400).json({
        error: `Tipo de barrio inválido. Opciones: ${validDistricts.join(', ')}`
      });
    }

    const store = new Store({
      name,
      description,
      districtType: districtType || 'barrio',
      districtName: districtName || Store.DISTRICT_PROFILES[districtType || 'barrio'].name,
      owner: req.user._id,
      // Default shelves for a new store
      shelves: [
        { position: { x: 0, y: 0 }, type: 'standard', category: 'alimentacion' },
        { position: { x: 2, y: 0 }, type: 'standard', category: 'bebidas' },
        { position: { x: 4, y: 0 }, type: 'standard', category: 'limpieza' },
        { position: { x: 6, y: 0 }, type: 'standard', category: 'farmacia' },
        { position: { x: 8, y: 0 }, type: 'standard', category: 'mascotas' },
        { position: { x: 0, y: 2 }, type: 'standard', category: 'electronica' },
        { position: { x: 2, y: 2 }, type: 'standard', category: 'moda' },
        { position: { x: 4, y: 2 }, type: 'standard', category: 'juguetes' },
        { position: { x: 6, y: 2 }, type: 'standard', category: 'jardineria' },
        { position: { x: 8, y: 2 }, type: 'checkout', category: 'alimentacion' }
      ]
    });
    await store.save();

    // Fill warehouse with products (shelves start empty)
    await fillWarehouse(store);
    // Restock shelves from warehouse
    await restockFromWarehouse(store);

    // Reload with stocked products
    const stockedStore = await Store.findById(store._id);

    req.user.storeIds.push(store._id);
    req.user.activeStoreId = store._id;
    await req.user.save();

    res.status(201).json({ store: stockedStore });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stores (public)
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find({ isOpen: true })
      .populate('owner', 'username level')
      .select('-warehouse -employees')
      .limit(50);
    res.json({ stores });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get my stores
router.get('/mine', auth, async (req, res) => {
  try {
    const stores = await Store.find({ owner: req.user._id });
    res.json({ stores });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single store
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('owner', 'username level reputation');
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update store
router.patch('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const allowedUpdates = ['name', 'description', 'layout', 'decoration', 'isOpen', 'districtType', 'districtName'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        store[field] = req.body[field];
      }
    });

    await store.save();
    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add shelf
router.post('/:id/shelves', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { position, type, category } = req.body;
    store.shelves.push({ position, type, category });
    await store.save();

    res.status(201).json({ shelf: store.shelves[store.shelves.length - 1] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove shelf
router.delete('/:id/shelves/:shelfIndex', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const index = parseInt(req.params.shelfIndex);
    if (index >= 0 && index < store.shelves.length) {
      store.shelves.splice(index, 1);
      await store.save();
    }

    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Hire employee
router.post('/:id/employees', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { name, role, salary } = req.body;
    store.employees.push({ name, role, salary });
    await store.save();

    res.status(201).json({ employee: store.employees[store.employees.length - 1] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fire employee
router.delete('/:id/employees/:empIndex', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const index = parseInt(req.params.empIndex);
    if (index >= 0 && index < store.employees.length) {
      store.employees.splice(index, 1);
      await store.save();
    }

    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Restock shelves with products from catalog (for existing stores)
router.post('/:id/restock', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    await autoStockStore(store);
    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add to warehouse
router.post('/:id/warehouse', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { productId, quantity, purchasePrice } = req.body;
    const existingItem = store.warehouse.find(
      w => w.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      store.warehouse.push({ productId, quantity, purchasePrice });
    }

    await store.save();
    res.json({ warehouse: store.warehouse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Open/close store
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    store.isOpen = !store.isOpen;
    await store.save();

    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Restock shelves from warehouse
router.post('/:id/restock', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, owner: req.user._id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const restocked = await restockFromWarehouse(store);
    res.json({ restocked, warehouse: store.warehouse, shelves: store.shelves });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
