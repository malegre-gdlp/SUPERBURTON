const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Database connection cache
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && cachedDb.readyState === 1) return cachedDb;
  try {
    const uri = process.env.MONGODB_URI ||
      'mongodb+srv://junta_db_user:1gQKARcW4PYdbpnO@cluster0.yg22wfb.mongodb.net/supermarket-simulator?retryWrites=true&w=majority&appName=Cluster0';
    cachedDb = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

// Initialize connection
connectToDatabase();

// Routes
const authRoutes = require('../server/src/routes/auth');
const storeRoutes = require('../server/src/routes/stores');
const catalogRoutes = require('../server/src/routes/catalog');
const economyRoutes = require('../server/src/routes/economy');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/economy', economyRoutes);

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

module.exports = app;
