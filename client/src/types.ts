// ============================================================
// Type definitions for SuperMarket Simulator Online
// ============================================================

export interface User {
  id: string
  username: string
  email?: string
  level: number
  experience: number
  experienceToNextLevel: number
  money: number
  bankBalance: number
  reputation: number
  avatar: string
  stats: UserStats
  storeIds: string[]
  settings: GameSettings
}

export interface UserStats {
  totalSales: number
  totalCustomers: number
  totalProfit: number
  daysPlayed: number
}

export interface GameSettings {
  musicVolume: number
  sfxVolume: number
  notifications: boolean
}

export interface Store {
  _id: string
  name: string
  owner: string | { username: string; level: number; reputation: number }
  description: string
  districtType: DistrictType
  districtName: string
  layout: StoreLayout
  shelves: Shelf[]
  decoration: Decoration
  employees: Employee[]
  warehouse: WarehouseItem[]
  stats: StoreStats
  customerLoyalty: number
  upgrades: Upgrades
  isOpen: boolean
  isFranchise: boolean
  priceFairnessHistory: FairnessRecord[]
  inspections: Inspection[]
}

export type DistrictType = 'barrio' | 'ciudad' | 'centro_comercial' | 'zona_exclusiva'

export interface DistrictProfile {
  name: string
  description: string
  maxSpendingPerCustomer: number
  avgBasketSize: number
  priceSensitivity: number
  qualityExpectation: number
  brandLoyalty: number
  customerCountMultiplier: number
  levelSpending: Record<number, { min: number; max: number }>
}

export interface StoreLayout {
  width: number
  height: number
  floors: number
}

export interface Shelf {
  position: { x: number; y: number }
  width: number
  height: number
  type: 'standard' | 'refrigerated' | 'frozen' | 'display' | 'checkout'
  category: string
  products: ShelfProduct[]
  unlocked: boolean
}

export interface ShelfProduct {
  productId: string
  quantity: number
  maxCapacity: number
  price: number
}

export interface Decoration {
  floorType: string
  wallColor: string
  theme: string
  decorations: { type: string; position: { x: number; y: number } }[]
}

export interface Employee {
  name: string
  role: 'cashier' | 'stockist' | 'manager' | 'cleaner' | 'security'
  salary: number
  efficiency: number
  happiness: number
}

export interface WarehouseItem {
  productId: string
  quantity: number
  minStock: number
  purchasePrice: number
}

export interface StoreStats {
  dailyCustomers: number
  dailySales: number
  dailyRevenue: number
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  rating: number
  popularity: number
  customerSatisfaction: number
  priceFairnessReputation: number
  averageBasketSize: number
  complaintsToday: number
  totalComplaints: number
}

export interface Upgrades {
  parkingLot: boolean
  securityCameras: boolean
  selfCheckout: boolean
  loyaltyProgram: boolean
  deliveryService: boolean
  onlineStore: boolean
}

export interface FairnessRecord {
  date: string
  fairnessScore: number
}

export interface Inspection {
  date: string
  reason: string
  result: 'passed' | 'warning' | 'fine' | 'closed'
  fine: number
}

export interface Product {
  _id: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  imageUrl: string
  basePrice: number
  wholesalePrice: number
  unit: string
  tax: number
  quality: number
  rarity: number
  manufacturingCost: number
  competitionCount: number
  demandFactor: number
  isSeasonal: boolean
  seasonMonths: number[]
  isWhiteLabel: boolean
  isActive: boolean
  whiteLabelDesign?: {
    ownerId: string
    brandName: string
    logoUrl?: string
    approved: boolean
    royaltyPercentage: number
    totalRoyaltiesEarned: number
  }
}

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export interface PriceRange {
  min: number
  max: number
  suggested: number
  districtCap?: number
  isCappedByDistrict?: boolean
  modifiers?: Record<string, number>
}

export interface ProductEvaluation {
  willBuy: boolean
  score: number
  priceFairnessScore: number
  valueScore: number
  reasons: string[]
}

export interface StoreTickResult {
  customers: number
  totalSales: number
  totalRevenue: number
  totalProfit: number
  totalSalaries: number
  netProfit: number
  productsSold: ProductSale[]
  rejectedPurchases: RejectedPurchase[]
  customerSatisfaction: number
  customerLoyalty: number
  priceFairnessReputation: number
  districtType: string
  averageBasketSize: number
  spendingLimit: number
}

export interface ProductSale {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalCost: number
  profit: number
}

export interface RejectedPurchase {
  productId: string
  productName: string
  price: number
  reason: string
  score: number
}

export interface MarketOverview {
  inflationRate: number
  globalDemand: number
  seasonMultiplier: number
  activeEvents: GameEvent[]
  totalActiveStores: number
  totalProducts: number
  districtTypes: Record<string, DistrictProfile>
}

export interface GameEvent {
  name: string
  type: string
  effects: {
    demandMultiplier: number
    priceMultiplier: number
  }
  duration: number
}

export interface Franchise {
  _id: string
  brandStore: string
  franchisee: string
  franchiseStore: string
  status: 'pending' | 'approved' | 'active' | 'terminated'
  contractTerms: {
    revenueShare: number
    fixedFee: number
    feePeriod: string
  }
  tier: string
}
