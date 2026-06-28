const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const { MarketEvent, PriceHistory } = require('../models/Economy');

/**
 * Smart Economy Engine for SuperMarket Simulator Online
 *
 * Implements:
 * - Customer purchasing power by district type
 * - Wholesale price limits (min/max based on cost, quality, demand, competition, rarity)
 * - Retail price limits (PVP min/max per store)
 * - Smart NPC customers (compare price, quality, brand, promos, distance, reputation)
 * - Reputation system (price abuse → penalties)
 * - Self-regulating economy (supply/demand adjusts price ranges)
 */
class EconomyEngine {
  constructor() {
    this.inflationRate = 0.02;
    this.globalDemand = 1.0;
    this.seasonalMultipliers = {
      1: 0.9, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.1, 6: 1.2,
      7: 1.2, 8: 1.1, 9: 1.0, 10: 1.0, 11: 1.1, 12: 1.3
    };
    this.eventCalendar = this.initEventCalendar();
  }

  initEventCalendar() {
    return [
      { name: 'Black Friday', startDay: 25, startMonth: 11, duration: 3,
        effects: { demandMultiplier: 3.0, priceMultiplier: 0.5 },
        type: 'promotion' },
      { name: 'Navidad', startDay: 15, startMonth: 12, duration: 20,
        effects: { demandMultiplier: 2.0, priceMultiplier: 1.3 },
        type: 'festivity' },
      { name: 'Halloween', startDay: 25, startMonth: 10, duration: 7,
        effects: { demandMultiplier: 1.5, priceMultiplier: 1.1 },
        type: 'festivity' },
      { name: 'Vuelta al Cole', startDay: 1, startMonth: 9, duration: 15,
        effects: { demandMultiplier: 1.8, priceMultiplier: 1.1 },
        type: 'promotion' },
      { name: 'Verano', startDay: 1, startMonth: 7, duration: 60,
        effects: { demandMultiplier: 1.3, priceMultiplier: 1.1 },
        type: 'seasonal' }
    ];
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    return this.seasonalMultipliers[month] || 1.0;
  }

  getActiveEvents() {
    const now = new Date();
    return this.eventCalendar.filter(event => {
      const startDate = new Date(now.getFullYear(), event.startMonth - 1, event.startDay);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + event.duration);
      return now >= startDate && now <= endDate;
    });
  }

  // =========================================================================
  // 1. WHOLESALE PRICE RANGE CALCULATION
  // =========================================================================
  // When a player creates a white-label product, the game calculates
  // a fair wholesale price range based on:
  //   - manufacturingCost
  //   - quality (higher quality → higher price)
  //   - demandFactor
  //   - competitionCount (more competition → lower price)
  //   - rarity (rarer → higher price)

  calculateWholesalePriceRange(product) {
    const cost = product.manufacturingCost || 1.0;
    const quality = product.quality || 50;
    const rarity = product.rarity || 10;
    const demand = product.demandFactor || 1.0;
    const competition = product.competitionCount || 0;

    // Base: cost + minimum margin (10%)
    const baseMin = cost * 1.10;
    const baseMax = cost * 2.50;

    // Quality modifier: +0% to +50% for quality 1-100
    const qualityModifier = 1.0 + (quality / 100) * 0.5;

    // Rarity modifier: +0% to +100% for rarity 1-100
    const rarityModifier = 1.0 + (rarity / 100) * 1.0;

    // Demand modifier: demandFactor 0.1-3.0
    const demandModifier = demand;

    // Competition modifier: each competitor reduces price by 2%, max 40% reduction
    const competitionModifier = Math.max(0.6, 1.0 - competition * 0.02);

    // Event effects
    let eventModifier = 1.0;
    this.getActiveEvents().forEach(event => {
      eventModifier *= (event.effects.priceMultiplier || 1.0);
    });

    // Inflation
    const inflationModifier = 1.0 + this.inflationRate;

    const combinedModifier = qualityModifier * rarityModifier * demandModifier
      * competitionModifier * eventModifier * inflationModifier;

    const minPrice = Math.round(baseMin * combinedModifier * 100) / 100;
    const maxPrice = Math.round(baseMax * combinedModifier * 100) / 100;

    return {
      min: Math.max(cost * 1.05, minPrice),
      max: Math.max(minPrice + 0.10, maxPrice),
      suggested: Math.round((minPrice + maxPrice) / 2 * 100) / 100,
      modifiers: {
        quality: qualityModifier,
        rarity: rarityModifier,
        demand: demandModifier,
        competition: competitionModifier,
        event: eventModifier,
        inflation: inflationModifier
      }
    };
  }

  // =========================================================================
  // 2. RETAIL PRICE RANGE (PVP) CALCULATION
  // =========================================================================
  // Each store has a PVP range based on:
  //   - wholesale price of the product
  //   - district type (max spending power)
  //   - store level
  //   - competition in the area

  calculateRetailPriceRange(product, store) {
    const wholesalePrice = product.wholesalePrice || 1.0;
    const districtProfile = store.getDistrictProfile();

    // Get the spending range for this store's level
    const spendingRange = store.getSpendingRange();

    // Calculate the PVP range from wholesale
    // Minimum: wholesale - 5% (loss leader / promotion)
    // Maximum: wholesale * 2.5 (normal retail markup)
    const pvpMinRaw = wholesalePrice * 0.95;
    const pvpMaxRaw = wholesalePrice * 2.50;

    // District spending power is a hard cap
    const districtMax = spendingRange.max;

    // Quality premium: higher quality products can be sold at higher markup
    const quality = product.quality || 50;
    const qualityPremium = 1.0 + (quality - 50) / 100 * 0.5; // -25% to +25%

    // Store reputation affects what customers will pay
    const reputationModifier = 1.0 + (store.stats.rating - 3) * 0.1;

    // Event effects
    let eventModifier = 1.0;
    this.getActiveEvents().forEach(event => {
      eventModifier *= (event.effects.priceMultiplier || 1.0);
    });

    // Customer loyalty discounts
    const loyaltyModifier = store.upgrades.loyaltyProgram ? 0.92 : 1.0;

    const finalMin = Math.round(pvpMinRaw * 100) / 100;
    const finalMax = Math.round(Math.min(
      pvpMaxRaw * qualityPremium * reputationModifier * eventModifier * loyaltyModifier,
      districtMax
    ) * 100) / 100;

    return {
      min: finalMin,
      max: Math.max(finalMin + 0.10, finalMax),
      suggested: Math.round((wholesalePrice * 1.40) * 100) / 100,
      districtCap: districtMax,
      isCappedByDistrict: finalMax >= districtMax
    };
  }

  // =========================================================================
  // 3. CUSTOMER PURCHASING POWER
  // =========================================================================

  getCustomerSpendingLimit(store) {
    const range = store.getSpendingRange();
    // Random within range, skewed toward the middle
    const avg = (range.min + range.max) / 2;
    const spread = (range.max - range.min) / 2;
    const roll = Math.random() * 2 - 1; // -1 to 1
    return Math.round((avg + roll * spread * 0.7) * 100) / 100;
  }

  // =========================================================================
  // 4. SMART NPC CUSTOMER DECISION-MAKING
  // =========================================================================
  // NPCs evaluate each product based on:
  //   - Price fairness (is price within reasonable range?)
  //   - Quality/price ratio
  //   - Brand recognition
  //   - Active promotions
  //   - Store reputation
  //   - Distance (simplified as store popularity proxy)

  evaluateProductForCustomer(product, shelfProduct, store) {
    const price = shelfProduct.price;
    const quality = product.quality || 50;
    const priceRange = this.calculateRetailPriceRange(product, store);

    // 1. PRICE FAIRNESS SCORE (0-100)
    let priceFairnessScore;
    if (price <= priceRange.max) {
      priceFairnessScore = 70 + 30 * (1 - (price - priceRange.min) / (priceRange.max - priceRange.min || 1));
    } else {
      const overpriceRatio = (price - priceRange.max) / priceRange.max;
      priceFairnessScore = Math.max(0, 70 - overpriceRatio * 200);
    }

    // 2. QUALITY/PRICE RATIO (0-100)
    const valueScore = Math.min(100, (quality / price) * 20);

    // 3. BRAND RECOGNITION
    const brandScore = product.isWhiteLabel ? 40 : 60;

    // 4. PROMOTIONS (event effects)
    let promoScore = 50;
    this.getActiveEvents().forEach(event => {
      if (event.effects.priceMultiplier < 1.0) {
        promoScore += 30;
      }
    });

    // 5. STORE REPUTATION
    const storeRepScore = store.stats.rating * 20;

    // 6. CUSTOMER LOYALTY
    const loyaltyScore = Math.max(0, 50 + store.customerLoyalty * 0.5);

    // 7. DISTANCE PROXY (popularity = more accessible)
    const distanceScore = Math.min(100, store.stats.popularity * 2 + 30);

    // Weighted final score
    const weights = {
      priceFairness: 0.30,
      valueRatio: 0.25,
      brand: 0.10,
      promotions: 0.10,
      storeReputation: 0.10,
      loyalty: 0.10,
      distance: 0.05
    };

    const finalScore =
      priceFairnessScore * weights.priceFairness +
      valueScore * weights.valueRatio +
      brandScore * weights.brand +
      promoScore * weights.promotions +
      storeRepScore * weights.storeReputation +
      loyaltyScore * weights.loyalty +
      distanceScore * weights.distance;

    return {
      willBuy: finalScore >= 35,
      score: Math.round(finalScore),
      priceFairnessScore: Math.round(priceFairnessScore),
      valueScore: Math.round(valueScore),
      reasons: this._getPurchaseReasons(finalScore, priceFairnessScore, price, priceRange)
    };
  }

  _getPurchaseReasons(score, fairness, price, priceRange) {
    const reasons = [];
    if (fairness < 30) reasons.push('precio excesivo');
    if (price < priceRange.min) reasons.push('precio de oferta');
    if (score >= 70) reasons.push('buena relación calidad-precio');
    if (score >= 85) reasons.push('excelente producto');
    return reasons;
  }

  // =========================================================================
  // 5. REPUTATION SYSTEM
  // =========================================================================

  evaluatePriceFairness(shelfProduct, product, store) {
    const priceRange = this.calculateRetailPriceRange(product, store);

    if (shelfProduct.price <= priceRange.max && shelfProduct.price >= priceRange.min) {
      return { fair: true, score: 1, note: 'Precio justo' };
    } else if (shelfProduct.price > priceRange.max) {
      const overprice = (shelfProduct.price - priceRange.max) / priceRange.max;
      return {
        fair: false,
        score: -1,
        overpriceRatio: overprice,
        note: overprice > 0.5
          ? 'Precio abusivo'
          : 'Precio algo elevado'
      };
    } else {
      return { fair: true, score: 0, note: 'Precio bajo (posible pérdida)' };
    }
  }

  async applyPriceAbusePenalties(store) {
    let unfairProducts = 0;
    let totalProducts = 0;

    for (const shelf of store.shelves) {
      for (const sp of shelf.products) {
        totalProducts++;
        const product = await Product.findById(sp.productId);
        if (!product) continue;
        const evaluation = this.evaluatePriceFairness(sp, product, store);
        if (!evaluation.fair && evaluation.overpriceRatio > 0.3) {
          unfairProducts++;
        }
      }
    }

    if (totalProducts === 0) return;

    const unfairRatio = unfairProducts / totalProducts;

    if (unfairRatio > 0.3) {
      store.stats.priceFairnessReputation = Math.max(0,
        store.stats.priceFairnessReputation - unfairRatio * 10
      );
      store.stats.customerSatisfaction = Math.max(0,
        store.stats.customerSatisfaction - unfairRatio * 15
      );
      store.customerLoyalty = Math.max(-50,
        store.customerLoyalty - unfairRatio * 20
      );

      store.priceFairnessHistory.push({
        date: new Date(),
        fairnessScore: -1
      });

      store.stats.complaintsToday += Math.floor(unfairProducts * (Math.random() * 3 + 1));
      store.stats.totalComplaints += store.stats.complaintsToday;

      store.stats.popularity = Math.max(0, store.stats.popularity - unfairRatio * 5);

      if (unfairRatio > 0.6 && store.priceFairnessHistory.filter(h => h.fairnessScore === -1).length > 5) {
        const inspectionChance = Math.random();
        if (inspectionChance < 0.15) {
          store.inspections.push({
            date: new Date(),
            reason: 'Posible abuso de precios detectado',
            result: 'warning',
            fine: Math.floor(unfairRatio * 10000 * (Math.random() + 0.5))
          });
        }
      }
    } else {
      store.stats.priceFairnessReputation = Math.min(100,
        store.stats.priceFairnessReputation + 1
      );
      store.customerLoyalty = Math.min(100,
        store.customerLoyalty + 0.5
      );

      store.priceFairnessHistory.push({
        date: new Date(),
        fairnessScore: 1
      });
    }

    if (store.priceFairnessHistory.length > 30) {
      store.priceFairnessHistory = store.priceFairnessHistory.slice(-30);
    }
  }

  // =========================================================================
  // 6. CUSTOMER COUNT CALCULATION (with price fairness factor)
  // =========================================================================

  calculateCustomerCount(store) {
    const profile = store.getDistrictProfile();
    const baseCustomers = 10 + store.stats.popularity * 2;
    const capacity = store.getCustomerCapacity();

    const districtMultiplier = profile.customerCountMultiplier;
    const ratingFactor = store.stats.rating / 3;
    const fairnessFactor = store.stats.priceFairnessReputation / 50;
    const loyaltyFactor = Math.max(0.5, 1.0 + store.customerLoyalty / 200);

    let eventFactor = 1.0;
    this.getActiveEvents().forEach(event => {
      eventFactor *= (event.effects.demandMultiplier || 1.0);
    });

    const seasonFactor = this.getCurrentSeason();

    let customers = Math.floor(
      baseCustomers * districtMultiplier * ratingFactor * fairnessFactor
      * loyaltyFactor * eventFactor * seasonFactor
    );

    return Math.max(2, Math.min(customers, capacity));
  }

  async processStoreTick(store) {
    if (!store.isOpen) return null;

    // First, apply price fairness evaluation
    await this.applyPriceAbusePenalties(store);

    const customers = this.calculateCustomerCount(store);
    let totalSales = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let productsSold = [];
    let rejectedPurchases = [];
    let totalSatisfactionDelta = 0;

    // Simulate smart customer purchases
    for (let i = 0; i < customers; i++) {
      const spendingLimit = this.getCustomerSpendingLimit(store);
      let remainingBudget = spendingLimit;
      let customerBasket = [];
      let customerSatisfied = true;

      // Each customer visits several shelves
      const shelfVisits = Math.min(store.shelves.length, Math.floor(Math.random() * 5) + 1);
      const visitedShelves = this._shuffleArray([...store.shelves]).slice(0, shelfVisits);

      for (const shelf of visitedShelves) {
        if (remainingBudget <= 0) break;
        if (!shelf.products.length) continue;

        // Pick a random product from this shelf
        const shelfProduct = shelf.products[Math.floor(Math.random() * shelf.products.length)];
        if (shelfProduct.quantity <= 0) continue;

        const product = await Product.findById(shelfProduct.productId);
        if (!product) continue;

        // Evaluate the product
        const evaluation = this.evaluateProductForCustomer(product, shelfProduct, store);

        if (evaluation.willBuy && shelfProduct.price <= remainingBudget) {
          // Customer wants to buy
          const quantity = Math.max(1,
            Math.min(
              Math.floor(Math.random() * 2) + 1,
              shelfProduct.quantity,
              Math.floor(remainingBudget / shelfProduct.price)
            )
          );

          if (quantity > 0) {
            const cost = quantity * shelfProduct.price;
            remainingBudget -= cost;
            shelfProduct.quantity -= quantity;

            // Find warehouse entry for cost
            const warehouseItem = store.warehouse.find(
              w => w.productId.toString() === shelfProduct.productId.toString()
            );
            const costPrice = warehouseItem ? warehouseItem.purchasePrice : (product.wholesalePrice || 0);

            customerBasket.push({
              productId: shelfProduct.productId,
              productName: product.name,
              quantity,
              unitPrice: shelfProduct.price,
              totalCost: cost,
              profit: quantity * (shelfProduct.price - costPrice)
            });

            totalSales += quantity;
            totalRevenue += cost;
            totalProfit += quantity * (shelfProduct.price - costPrice);

            // Satisfaction based on value score
            if (evaluation.score < 50) customerSatisfied = false;
          }
        } else if (!evaluation.willBuy) {
          // Record rejected purchase (too expensive)
          rejectedPurchases.push({
            productId: shelfProduct.productId,
            productName: product.name,
            price: shelfProduct.price,
            reason: evaluation.reasons.join(', '),
            score: evaluation.score
          });

          if (evaluation.priceFairnessScore < 30) {
            customerSatisfied = false;
          }
        }
      }

      if (customerBasket.length > 0) {
        productsSold.push(...customerBasket);
      }

      if (!customerSatisfied) {
        totalSatisfactionDelta -= 1;
      } else if (customerBasket.length > 0) {
        totalSatisfactionDelta += 0.5;
      }
    }

    // Update store stats
    store.stats.dailyCustomers += customers;
    store.stats.dailySales += totalSales;
    store.stats.dailyRevenue += totalRevenue;
    store.stats.totalCustomers += customers;
    store.stats.totalSales += totalSales;
    store.stats.totalRevenue += totalRevenue;

    // Update satisfaction
    store.stats.customerSatisfaction = Math.max(0,
      Math.min(100,
        store.stats.customerSatisfaction + totalSatisfactionDelta * 2
      )
    );

    // Update rating based on satisfaction and price fairness
    const satisfactionRating = (store.stats.customerSatisfaction / 100) * 5;
    const fairnessRating = (store.stats.priceFairnessReputation / 100) * 5;
    store.stats.rating = Math.round(
      (satisfactionRating * 0.4 + fairnessRating * 0.3 + store.stats.rating * 0.3) * 10
    ) / 10;

    // Update average basket size
    if (productsSold.length > 0) {
      const totalBasketValue = productsSold.reduce((sum, p) => sum + p.totalCost, 0);
      store.stats.averageBasketSize = Math.round(
        (store.stats.averageBasketSize * 0.7 + (totalBasketValue / Math.max(1, customers)) * 0.3) * 100
      ) / 100;
    }

    // Pay employees
    const totalSalaries = store.employees.reduce((sum, e) => sum + e.salary, 0);

    // Auto-restock: employees refill shelves from warehouse (lightweight)
    let restockedCount = 0;
    const Product = require('../models/Product');

    for (const shelf of store.shelves) {
      if (shelf.type === 'checkout') continue;
      
      // Find warehouse items for this shelf's category using product lookup
      const shelfWarehouseItems = store.warehouse.filter(w => w.quantity > 0);
      
      for (const warehouseItem of shelfWarehouseItems) {
        if (warehouseItem.quantity <= 0) continue;
        const shelfProduct = shelf.products.find(
          sp => sp.productId.toString() === warehouseItem.productId.toString()
        );
        if (shelfProduct) {
          const spaceLeft = shelfProduct.maxCapacity - shelfProduct.quantity;
          if (spaceLeft > 0) {
            const toAdd = Math.min(warehouseItem.quantity, spaceLeft, 10);
            shelfProduct.quantity += toAdd;
            warehouseItem.quantity -= toAdd;
            restockedCount += toAdd;
          }
        } else {
          shelf.products.push({
            productId: warehouseItem.productId,
            quantity: Math.min(warehouseItem.quantity, 10),
            maxCapacity: 50,
            price: Math.round(warehouseItem.purchasePrice * 1.3 * 100) / 100
          });
          const added = Math.min(warehouseItem.quantity, 10);
          warehouseItem.quantity -= added;
          restockedCount += added;
        }
      }
      
      // If shelf still has few products, fill warehouse with category products
      if (shelf.products.length < 2) {
        const catProducts = await Product.find({ category: shelf.category, isActive: true }).select('_id wholesalePrice').limit(5);
        for (const p of catProducts) {
          if (!store.warehouse.find(w => w.productId.toString() === p._id.toString())) {
            store.warehouse.push({
              productId: p._id,
              quantity: 50 + Math.floor(Math.random() * 30),
              minStock: 10,
              purchasePrice: p.wholesalePrice
            });
          }
        }
      }
    }

    await store.save();

    return {
      customers,
      totalSales,
      totalRevenue,
      totalProfit,
      totalSalaries,
      netProfit: totalRevenue - totalSalaries - (totalRevenue - totalProfit), // revenue - salaries - cost of goods
      productsSold,      restocked: restockedCount,      rejectedPurchases: rejectedPurchases.slice(0, 5),
      customerSatisfaction: store.stats.customerSatisfaction,
      customerLoyalty: store.customerLoyalty,
      priceFairnessReputation: store.stats.priceFairnessReputation,
      districtType: store.districtType,
      averageBasketSize: store.stats.averageBasketSize,
      spendingLimit: this.getCustomerSpendingLimit(store)
    };
  }

  // =========================================================================
  // 8. SELF-REGULATING ECONOMY
  // =========================================================================

  async updateMarketCompetition() {
    // Count how many stores are selling each product
    const stores = await Store.find({ isOpen: true });
    const productCount = {};

    for (const store of stores) {
      for (const shelf of store.shelves) {
        for (const sp of shelf.products) {
          const pid = sp.productId.toString();
          productCount[pid] = (productCount[pid] || 0) + 1;
        }
      }
    }

    // Update competition counts on products
    for (const [productId, count] of Object.entries(productCount)) {
      await Product.findByIdAndUpdate(productId, {
        competitionCount: count
      });
    }

    // Adjust global demand based on total market activity
    const totalStores = stores.length;
    this.globalDemand = Math.max(0.5, Math.min(2.0, 1.0 + (100 - totalStores) * 0.01));

    // Random inflation fluctuation
    this.inflationRate = Math.max(-0.02, Math.min(0.10,
      this.inflationRate + (Math.random() - 0.5) * 0.01
    ));

    return {
      totalActiveStores: totalStores,
      globalDemand: this.globalDemand,
      inflationRate: this.inflationRate
    };
  }

  // =========================================================================
  // 9. WHITE LABEL PRICING VALIDATION
  // =========================================================================

  validateWhiteLabelPrice(product, proposedWholesalePrice) {
    const range = this.calculateWholesalePriceRange(product);

    return {
      valid: proposedWholesalePrice >= range.min && proposedWholesalePrice <= range.max,
      proposedPrice: proposedWholesalePrice,
      allowedRange: range,
      error: proposedWholesalePrice < range.min
        ? `El precio mínimo permitido es ${range.min} €`
        : proposedWholesalePrice > range.max
          ? `El precio máximo permitido es ${range.max} €`
          : null
    };
  }

  validateRetailPrice(product, store, proposedPrice) {
    const range = this.calculateRetailPriceRange(product, store);

    return {
      valid: proposedPrice >= range.min && proposedPrice <= range.max,
      proposedPrice,
      allowedRange: range,
      error: proposedPrice < range.min
        ? `El precio mínimo de venta es ${range.min} € (promoción)`
        : proposedPrice > range.max
          ? `El precio máximo permitido en ${store.districtName} es ${range.max} €`
          : null
    };
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async getMarketOverview() {
    let totalActiveStores = 0;
    let totalProducts = 0;
    try {
      totalActiveStores = await Store.countDocuments({ isOpen: true });
      totalProducts = await Product.countDocuments({ isActive: true });
    } catch (e) {
      console.error('Market overview count error:', e.message);
    }
    return {
      inflationRate: Math.round(this.inflationRate * 1000) / 1000,
      globalDemand: Math.round(this.globalDemand * 100) / 100,
      seasonMultiplier: this.getCurrentSeason(),
      activeEvents: this.getActiveEvents(),
      totalActiveStores,
      totalProducts,
      districtTypes: Store.DISTRICT_PROFILES
    };
  }
}

module.exports = new EconomyEngine();
