const mongoose = require('mongoose');

const shelfSchema = new mongoose.Schema({
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  width: { type: Number, default: 2 },
  height: { type: Number, default: 1 },
  type: {
    type: String,
    enum: ['standard', 'refrigerated', 'frozen', 'display', 'checkout'],
    default: 'standard'
  },
  category: {
    type: String,
    enum: ['alimentacion', 'bebidas', 'limpieza', 'mascotas', 'electronica', 'jardineria', 'farmacia', 'moda', 'juguetes'],
    default: 'alimentacion'
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 0 },
    maxCapacity: { type: Number, default: 50 },
    price: { type: Number, default: 0 }
  }],
  unlocked: { type: Boolean, default: true }
});

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  districtType: {
    type: String,
    enum: ['barrio', 'ciudad', 'centro_comercial', 'zona_exclusiva'],
    default: 'barrio'
  },
  districtName: {
    type: String,
    default: 'Barrio Obrero'
  },
  customerLoyalty: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  priceFairnessHistory: [{
    date: { type: Date },
    fairnessScore: { type: Number } // -1 unfair, 0 neutral, 1 fair
  }],
  inspections: [{
    date: { type: Date },
    reason: { type: String },
    result: { type: String, enum: ['passed', 'warning', 'fine', 'closed'] },
    fine: { type: Number, default: 0 }
  }],
  layout: {
    width: { type: Number, default: 10 },
    height: { type: Number, default: 8 },
    floors: { type: Number, default: 1 }
  },
  shelves: [shelfSchema],
  decoration: {
    floorType: { type: String, default: 'tile' },
    wallColor: { type: String, default: '#f5f5f5' },
    theme: { type: String, default: 'modern' },
    decorations: [{
      type: { type: String },
      position: {
        x: Number,
        y: Number
      }
    }]
  },
  employees: [{
    name: { type: String },
    role: {
      type: String,
      enum: ['cashier', 'stockist', 'manager', 'cleaner', 'security'],
      default: 'cashier'
    },
    salary: { type: Number, default: 1000 },
    efficiency: { type: Number, default: 1.0 },
    happiness: { type: Number, default: 100 },
    hired: { type: Date, default: Date.now }
  }],
  warehouse: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    purchasePrice: { type: Number, default: 0 }
  }],
  stats: {
    dailyCustomers: { type: Number, default: 0 },
    dailySales: { type: Number, default: 0 },
    dailyRevenue: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    rating: { type: Number, default: 3.0, min: 0, max: 5 },
    popularity: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 50, min: 0, max: 100 },
    priceFairnessReputation: { type: Number, default: 50, min: 0, max: 100 },
    averageBasketSize: { type: Number, default: 15 },
    complaintsToday: { type: Number, default: 0 },
    totalComplaints: { type: Number, default: 0 }
  },
  upgrades: {
    parkingLot: { type: Boolean, default: false },
    securityCameras: { type: Boolean, default: false },
    selfCheckout: { type: Boolean, default: false },
    loyaltyProgram: { type: Boolean, default: false },
    deliveryService: { type: Boolean, default: false },
    onlineStore: { type: Boolean, default: false }
  },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: false },
  isFranchise: { type: Boolean, default: false },
  franchiseOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  createdAt: { type: Date, default: Date.now },
  lastProcessed: { type: Date, default: Date.now },
  lastDailyReset: { type: Date, default: Date.now }
});

// District spending profiles
storeSchema.statics.DISTRICT_PROFILES = {
  barrio: {
    name: 'Barrio',
    description: 'Clientes con presupuestos bajos',
    maxSpendingPerCustomer: 30,
    avgBasketSize: 15,
    priceSensitivity: 0.9,
    qualityExpectation: 0.3,
    brandLoyalty: 0.4,
    customerCountMultiplier: 1.3,
    levelSpending: {
      1: { min: 1, max: 10 },
      5: { min: 3, max: 15 },
      10: { min: 5, max: 30 },
      25: { min: 10, max: 50 },
      50: { min: 20, max: 80 }
    }
  },
  ciudad: {
    name: 'Ciudad',
    description: 'Presupuesto medio',
    maxSpendingPerCustomer: 80,
    avgBasketSize: 35,
    priceSensitivity: 0.6,
    qualityExpectation: 0.5,
    brandLoyalty: 0.5,
    customerCountMultiplier: 1.0,
    levelSpending: {
      1: { min: 3, max: 30 },
      5: { min: 10, max: 50 },
      10: { min: 20, max: 80 },
      25: { min: 40, max: 120 },
      50: { min: 60, max: 200 }
    }
  },
  centro_comercial: {
    name: 'Centro Comercial',
    description: 'Presupuesto medio-alto',
    maxSpendingPerCustomer: 200,
    avgBasketSize: 60,
    priceSensitivity: 0.4,
    qualityExpectation: 0.7,
    brandLoyalty: 0.6,
    customerCountMultiplier: 0.8,
    levelSpending: {
      1: { min: 5, max: 40 },
      5: { min: 15, max: 80 },
      10: { min: 30, max: 200 },
      25: { min: 80, max: 350 },
      50: { min: 150, max: 500 }
    }
  },
  zona_exclusiva: {
    name: 'Zona Exclusiva',
    description: 'Clientes con alto poder adquisitivo',
    maxSpendingPerCustomer: 2000,
    avgBasketSize: 150,
    priceSensitivity: 0.2,
    qualityExpectation: 0.9,
    brandLoyalty: 0.7,
    customerCountMultiplier: 0.5,
    levelSpending: {
      1: { min: 10, max: 50 },
      5: { min: 30, max: 150 },
      10: { min: 80, max: 500 },
      25: { min: 200, max: 1000 },
      50: { min: 500, max: 2000 }
    }
  }
};

storeSchema.methods.getTotalProducts = function() {
  return this.shelves.reduce((total, shelf) => {
    return total + shelf.products.reduce((sum, p) => sum + p.quantity, 0);
  }, 0);
};

storeSchema.methods.getCustomerCapacity = function() {
  return this.layout.width * this.layout.height * 3;
};

storeSchema.methods.getSpendingRange = function() {
  const profile = storeSchema.statics.DISTRICT_PROFILES[this.districtType];
  if (!profile) return { min: 1, max: 10 };

  // Find the appropriate level tier
  const levels = Object.keys(profile.levelSpending).map(Number).sort((a, b) => b - a);
  let tier = levels[levels.length - 1];
  for (const lvl of levels) {
    if (this.owner?.level >= lvl || this.stats?.totalCustomers >= lvl * 100) {
      tier = lvl;
      break;
    }
  }

  return profile.levelSpending[tier] || profile.levelSpending[1];
};

storeSchema.methods.getDistrictProfile = function() {
  return storeSchema.statics.DISTRICT_PROFILES[this.districtType] ||
    storeSchema.statics.DISTRICT_PROFILES.barrio;
};

/* Level system: gain experience from sales, level up */
const XP_PER_SALE = 10;
const XP_PER_CUSTOMER = 5;
const XP_PER_REVENUE_UNIT = 2; // per euro
const BASE_XP_NEXT = 500;
const XP_SCALE = 1.4;

storeSchema.methods.addExperience = function(sales, customers, revenue) {
  const xp = sales * XP_PER_SALE + customers * XP_PER_CUSTOMER + revenue * XP_PER_REVENUE_UNIT;
  this.experience += Math.floor(xp);
  // Level up while enough XP
  let needed = Math.floor(BASE_XP_NEXT * Math.pow(XP_SCALE, this.level - 1));
  while (this.experience >= needed) {
    this.experience -= needed;
    this.level += 1;
    needed = Math.floor(BASE_XP_NEXT * Math.pow(XP_SCALE, this.level - 1));
  }
};

/* Get level bonus multiplier for customers */
storeSchema.methods.getLevelMultiplier = function() {
  return 1 + (this.level - 1) * 0.15; // +15% per level
};

storeSchema.methods.getMaxCustomers = function() {
  return 10 + this.level * 5 + this.shelves.length * 2 + this.employees.length * 3;
};

const StoreModel = mongoose.model('Store', storeSchema);
StoreModel.DISTRICT_PROFILES = storeSchema.statics.DISTRICT_PROFILES;
module.exports = StoreModel;
