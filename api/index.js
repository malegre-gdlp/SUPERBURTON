const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Database connection promise (cached for warm starts)
let dbPromise = null;
let dbReady = false;
const MONGO_URI = process.env.MONGODB_URI ||
  'mongodb+srv://junta_db_user:1gQKARcW4PYdbpnO@cluster0.yg22wfb.mongodb.net/supermarket-simulator?retryWrites=true&w=majority&appName=Cluster0';

async function connectToDatabase() {
  if (dbReady) return;
  if (dbPromise) return dbPromise;
  
  dbPromise = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  }).then(() => {
    dbReady = true;
  }).catch(err => {
    console.error('MongoDB connection error:', err.message);
    dbPromise = null;
    throw err;
  });
  
  return dbPromise;
}

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

// DB connection middleware — ensures DB ready before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(503).json({
      error: 'Base de datos no disponible. Inténtalo de nuevo.',
      detail: err.message
    });
  }
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
