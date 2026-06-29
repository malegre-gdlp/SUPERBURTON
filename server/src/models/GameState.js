const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  day: { type: Number, default: 1 },
  hour: { type: Number, default: 8 },      // 0-23 hour of day
  minute: { type: Number, default: 0 },    // 0-59
  timeSpeed: { type: Number, default: 1 },  // 1=normal, 2=doble, etc
  lastTick: { type: Date, default: Date.now },
  tickInterval: { type: Number, default: 60000 },
  tickCount: { type: Number, default: 0 },
  season: { type: String, default: 'verano' },
  weather: { type: String, default: 'soleado' },
  totalStoresEver: { type: Number, default: 0 },
  totalRevenueEver: { type: Number, default: 0 },
  totalCustomersEver: { type: Number, default: 0 }
});

// Advance time by one tick (advances ~2h per tick)
gameStateSchema.methods.advanceTime = function() {
  this.minute += 120 * this.timeSpeed; // 2 hours per tick
  while (this.minute >= 60) {
    this.minute -= 60;
    this.hour += 1;
  }
  while (this.hour >= 24) {
    this.hour -= 24;
    this.day += 1;
  }
  // Update season based on month (simulated by day cycles)
  const monthIndex = (this.day % 365) % 12;
  const seasons = ['invierno','invierno','primavera','primavera','primavera','verano','verano','verano','otoño','otoño','otoño','invierno'];
  this.season = seasons[monthIndex] || 'verano';
  // Random weather
  const weathers = ['soleado','nublado','lluvioso','tormenta','nevado'];
  this.weather = weathers[Math.floor(Math.random() * weathers.length)];
};

module.exports = mongoose.model('GameState', gameStateSchema);
