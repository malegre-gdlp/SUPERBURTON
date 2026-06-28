const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['alimentacion', 'bebidas', 'limpieza', 'mascotas', 'electronica', 'jardineria', 'farmacia', 'moda', 'juguetes']
  },
  subcategory: {
    type: String,
    default: ''
  },
  brand: {
    type: String,
    default: 'Generic'
  },
  imageUrl: {
    type: String,
    default: 'default-product.png'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0.01
  },
  wholesalePrice: {
    type: Number,
    required: true,
    min: 0.01
  },
  unit: {
    type: String,
    default: 'unit',
    enum: ['unit', 'kg', 'g', 'l', 'ml', 'pack']
  },
  tax: {
    type: Number,
    default: 0.21,
    min: 0
  },
  // Quality score (1-100) - affects customer preference
  quality: {
    type: Number,
    default: 50,
    min: 1,
    max: 100
  },
  // Rarity (1-100) - 1=common, 100=extremely rare
  rarity: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  // Manufacturing cost per unit (for white label)
  manufacturingCost: {
    type: Number,
    default: 1.0,
    min: 0.01
  },
  // How many competitors are selling this product (self-regulated)
  competitionCount: {
    type: Number,
    default: 0
  },
  isSeasonal: {
    type: Boolean,
    default: false
  },
  seasonMonths: [{
    type: Number,
    min: 1,
    max: 12
  }],
  demandFactor: {
    type: Number,
    default: 1.0,
    min: 0.1,
    max: 3.0
  },
  isWhiteLabel: {
    type: Boolean,
    default: false
  },
  whiteLabelDesign: {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    brandName: { type: String },
    logoUrl: { type: String },
    approved: { type: Boolean, default: false },
    royaltyPercentage: { type: Number, default: 5, min: 0, max: 20 },
    totalRoyaltiesEarned: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ category: 1, name: 1 });
productSchema.index({ isSeasonal: 1, seasonMonths: 1 });

module.exports = mongoose.model('Product', productSchema);
