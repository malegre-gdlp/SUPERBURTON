const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  brandStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  brandOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  franchisee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  franchiseStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'terminated'],
    default: 'pending'
  },
  contractTerms: {
    revenueShare: { type: Number, default: 5, min: 1, max: 50 },
    fixedFee: { type: Number, default: 0 },
    feePeriod: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    duration: { type: Number, default: 12 }, // months
    autoRenew: { type: Boolean, default: false }
  },
  benefits: {
    exclusiveProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    marketingSupport: { type: Boolean, default: true },
    supplierDiscounts: { type: Number, default: 5 },
    brandDecorations: { type: Boolean, default: true }
  },
  totalPaid: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  branches: [{
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    openedDate: { type: Date },
    status: { type: String, enum: ['active', 'closed'], default: 'active' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Franchise', franchiseSchema);
