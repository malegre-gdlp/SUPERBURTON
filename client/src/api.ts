import axios from 'axios'
import type {
  User, Store, Product, Category, PriceRange, MarketOverview,
  StoreTickResult, Franchise, DistrictProfile
} from './types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================
// AUTH
// ============================================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { username, email, password }),
  getProfile: () => api.get<{ user: User }>('/auth/profile'),
  updateProfile: (data: Partial<User>) => api.patch('/auth/profile', data)
}

// ============================================================
// STORES
// ============================================================
export const storeApi = {
  create: (data: { name: string; description?: string; districtType?: string }) =>
    api.post<{ store: Store }>('/stores', data),
  getAll: () => api.get<{ stores: Store[] }>('/stores'),
  getMine: () => api.get<{ stores: Store[] }>('/stores/mine'),
  getById: (id: string) => api.get<{ store: Store }>(`/stores/${id}`),
  update: (id: string, data: Partial<Store>) =>
    api.patch<{ store: Store }>(`/stores/${id}`, data),
  toggleOpen: (id: string) =>
    api.patch<{ store: Store }>(`/stores/${id}/toggle`),
  addShelf: (id: string, data: { position: { x: number; y: number }; type: string; category: string }) =>
    api.post(`/stores/${id}/shelves`, data),
  removeShelf: (id: string, index: number) =>
    api.delete(`/stores/${id}/shelves/${index}`),
  hireEmployee: (id: string, data: { name: string; role: string; salary: number }) =>
    api.post(`/stores/${id}/employees`, data),
  fireEmployee: (id: string, index: number) =>
    api.delete(`/stores/${id}/employees/${index}`),
  addToWarehouse: (id: string, data: { productId: string; quantity: number; purchasePrice: number }) =>
    api.post(`/stores/${id}/warehouse`, data)
}

// ============================================================
// CATALOG
// ============================================================
export const catalogApi = {
  getAll: (params?: { category?: string; search?: string; page?: number }) =>
    api.get<{ products: Product[]; total: number; page: number; totalPages: number }>('/catalog', { params }),
  getById: (id: string) => api.get<{ product: Product }>(`/catalog/${id}`),
  getCategories: () => api.get<{ categories: Category[] }>('/catalog/meta/categories'),
  submitWhiteLabel: (data: {
    name: string; description: string; category: string;
    brandName: string; logoUrl?: string; imageUrl?: string
  }) => api.post('/catalog/white-label', data)
}

// ============================================================
// ECONOMY
// ============================================================
export const economyApi = {
  getOverview: () => api.get<{ market: MarketOverview }>('/economy/overview'),
  getWholesaleRange: (productId: string) =>
    api.get<{ range: PriceRange }>(`/economy/wholesale-range/${productId}`),
  getRetailRange: (productId: string, storeId: string) =>
    api.get<{ range: PriceRange; districtProfile: DistrictProfile }>(
      `/economy/retail-range/${productId}/${storeId}`
    ),
  getDistricts: () => api.get<{ districts: Record<string, DistrictProfile> }>('/economy/districts'),
  validateWholesale: (productId: string, proposedPrice: number) =>
    api.post('/economy/validate-wholesale', { productId, proposedPrice }),
  validateRetail: (productId: string, storeId: string, proposedPrice: number) =>
    api.post('/economy/validate-retail', { productId, storeId, proposedPrice }),
  tickStore: (storeId: string) =>
    api.post<{ result: StoreTickResult }>(`/economy/tick/${storeId}`),
  updateMarket: () => api.post('/economy/update-market')
}

// ============================================================
// SOCIAL / MARKETPLACE
// ============================================================
export const socialApi = {
  getFranchises: () => api.get('/franchises'),
  requestFranchise: (data: { brandStoreId: string; terms: object }) =>
    api.post('/franchises/request', data),
  approveFranchise: (id: string) => api.patch(`/franchises/${id}/approve`),
  getMarketplace: () => api.get('/marketplace'),
  buyFromMarketplace: (data: { productId: string; storeId: string; quantity: number }) =>
    api.post('/marketplace/buy', data)
}

export default api
