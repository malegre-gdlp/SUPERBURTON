const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const catalogRoutes = require('./routes/catalog');
const economyRoutes = require('./routes/economy');
const socialRoutes = require('./routes/social');
const franchiseRoutes = require('./routes/franchises');
const eventRoutes = require('./routes/events');
const marketplaceRoutes = require('./routes/marketplace');
const whiteLabelRoutes = require('./routes/whiteLabel');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/assets', express.static('public/assets'));

// Make io accessible to routes
app.set('io', io);

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-store', (storeId) => {
    socket.join(`store-${storeId}`);
    console.log(`Socket ${socket.id} joined store ${storeId}`);
  });

  socket.on('leave-store', (storeId) => {
    socket.leave(`store-${storeId}`);
  });

  socket.on('visit-store', (storeId) => {
    socket.to(`store-${storeId}`).emit('visitor-joined', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('send-chat', (data) => {
    io.to(`store-${data.storeId}`).emit('chat-message', {
      userId: data.userId,
      username: data.username,
      message: data.message,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket-simulator';

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
};

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('Connected to MongoDB');
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      // Start server without DB for development
      console.log('Starting server without database connection...');
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (no database)`);
      });
    });
}

module.exports = { app, server, io };
