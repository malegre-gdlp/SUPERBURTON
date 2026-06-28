const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes
const authRoutes = require('../server/src/routes/auth');
const storeRoutes = require('../server/src/routes/stores');
const catalogRoutes = require('../server/src/routes/catalog');
const economyRoutes = require('../server/src/routes/economy');
const socialRoutes = require('../server/src/routes/social');
const franchiseRoutes = require('../server/src/routes/franchises');
const eventRoutes = require('../server/src/routes/events');
const marketplaceRoutes = require('../server/src/routes/marketplace');
const whiteLabelRoutes = require('../server/src/routes/whiteLabel');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/franchises', franchiseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/white-label', whiteLabelRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Cached MongoDB connection for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && cachedDb.readyState === 1) {
    return cachedDb;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://junta_db_user:1gQKARcW4PYdbpnO@cluster0.yg22wfb.mongodb.net/supermarket-simulator?retryWrites=true&w=majority');
    cachedDb = db;
    console.log('MongoDB connected (serverless)');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return null;
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  // Set CORS headers explicitly for serverless
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Connect to database (non-blocking - app works without it)
  await connectToDatabase();

  // Let Express handle the request
  return app(req, res);
};
