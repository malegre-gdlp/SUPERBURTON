const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'default'
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  experienceToNextLevel: {
    type: Number,
    default: 1000
  },
  money: {
    type: Number,
    default: 50000
  },
  bankBalance: {
    type: Number,
    default: 0
  },
  reputation: {
    type: Number,
    default: 0
  },
  storeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  activeStoreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  stats: {
    totalSales: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    daysPlayed: { type: Number, default: 0 }
  },
  settings: {
    musicVolume: { type: Number, default: 50 },
    sfxVolume: { type: Number, default: 70 },
    notifications: { type: Boolean, default: true }
  },
  inventory: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  while (this.experience >= this.experienceToNextLevel) {
    this.experience -= this.experienceToNextLevel;
    this.level += 1;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
  }
};

module.exports = mongoose.model('User', userSchema);
