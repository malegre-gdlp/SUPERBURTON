const mongoose = require('mongoose');

const marketEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['strike', 'logistics', 'festivity', 'natural_disaster', 'economic', 'promotion'],
    required: true
  },
  effects: {
    priceMultiplier: { type: Number, default: 1.0 },
    demandMultiplier: { type: Number, default: 1.0 },
    supplyMultiplier: { type: Number, default: 1.0 },
    affectedCategories: [{ type: String }]
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
});

const priceHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  date: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  demand: { type: Number, default: 1.0 },
  supply: { type: Number, default: 1.0 }
});

priceHistorySchema.index({ productId: 1, date: -1 });

const economySnapshotSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  inflationRate: { type: Number, default: 0 },
  globalDemand: { type: Number, default: 1.0 },
  activeEvents: [marketEventSchema],
  topSellingProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sales: { type: Number }
  }]
});

module.exports = {
  MarketEvent: mongoose.model('MarketEvent', marketEventSchema),
  PriceHistory: mongoose.model('PriceHistory', priceHistorySchema),
  EconomySnapshot: mongoose.model('EconomySnapshot', economySnapshotSchema)
};
