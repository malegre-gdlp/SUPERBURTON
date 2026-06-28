const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 20000);

// Database connection
let dbPromise = null;
let dbReady = false;
let dbError = null;
const MONGO_URI = process.env.MONGODB_URI ||
  'mongodb://junta_db_user:1gQKARcW4PYdbpnO@ac-pysrurk-shard-00-01.yg22wfb.mongodb.net:27017/supermarket-simulator?ssl=true&authSource=admin&directConnection=true&serverSelectionTimeoutMS=5000';
  // directConnection to primary (00-01) avoids replica set discovery issues on Vercel

async function connectToDatabase() {
  if (dbReady) return;
  if (dbPromise) return dbPromise;
  
  dbPromise = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  }).then(() => {
    dbReady = true;
    dbError = null;
  }).catch(err => {
    dbError = err.message;
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
const gameRoutes = require('../server/src/routes/game');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));

// Debug endpoint (before DB middleware) — always works
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    node: process.version,
    dbReady,
    dbError,
    hasDbPromise: !!dbPromise,
    mongooseState: mongoose.connection.readyState
  });
});

// DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    if (!dbReady) {
      return res.status(503).json({
        error: 'Conectando a la base de datos...',
        detail: dbError || 'La conexión a MongoDB Atlas no está disponible. Ve a Network Access y añade 0.0.0.0/0'
      });
    }
    next();
  } catch (err) {
    dbError = err.message;
    res.status(503).json({
      error: 'Base de datos no disponible',
      detail: err.message,
      fix: 'Añade 0.0.0.0/0 en MongoDB Atlas → Network Access'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/game', gameRoutes);

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
