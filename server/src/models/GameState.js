const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  day: { type: Number, default: 1 },
  lastTick: { type: Date, default: Date.now },
  tickInterval: { type: Number, default: 60000 }, // 1 min between global ticks
  tickCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('GameState', gameStateSchema);
