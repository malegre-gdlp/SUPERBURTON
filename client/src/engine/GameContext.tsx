import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { User, Store, Product, MarketOverview, DistrictProfile } from '../types'
import { authApi, storeApi, economyApi } from '../api'

// ============================================================
// State
// ============================================================
interface GameState {
  user: User | null
  stores: Store[]
  activeStore: Store | null
  products: Product[]
  marketOverview: MarketOverview | null
  districts: Record<string, DistrictProfile>
  loading: boolean
  error: string | null
  notifications: GameNotification[]
}

interface GameNotification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  timestamp: number
}

const initialState: GameState = {
  user: null,
  stores: [],
  activeStore: null,
  products: [],
  marketOverview: null,
  districts: {},
  loading: false,
  error: null,
  notifications: []
}

// ============================================================
// Actions
// ============================================================
type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_ACTIVE_STORE'; payload: Store | null }
  | { type: 'UPDATE_STORE'; payload: Store }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_MARKET_OVERVIEW'; payload: MarketOverview }
  | { type: 'SET_DISTRICTS'; payload: Record<string, DistrictProfile> }
  | { type: 'ADD_NOTIFICATION'; payload: GameNotification }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }
    case 'LOGOUT':
      return { ...initialState }
    case 'SET_STORES':
      return { ...state, stores: action.payload }
    case 'SET_ACTIVE_STORE':
      return { ...state, activeStore: action.payload }
    case 'UPDATE_STORE':
      return {
        ...state,
        stores: state.stores.map(s =>
          s._id === action.payload._id ? action.payload : s
        ),
        activeStore: state.activeStore?._id === action.payload._id
          ? action.payload : state.activeStore
      }
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload }
    case 'SET_MARKET_OVERVIEW':
      return { ...state, marketOverview: action.payload }
    case 'SET_DISTRICTS':
      return { ...state, districts: action.payload }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50)
      }
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    default:
      return state
  }
}

// ============================================================
// Context
// ============================================================
interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  loadStores: () => Promise<void>
  selectStore: (id: string) => Promise<void>
  loadMarketOverview: () => Promise<void>
  notify: (type: GameNotification['type'], message: string) => void
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const notify = useCallback((type: GameNotification['type'], message: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type,
        message,
        timestamp: Date.now()
      }
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('token', data.token)
      dispatch({ type: 'SET_USER', payload: data.user })
      notify('success', `¡Bienvenido, ${data.user.username}!`)
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Error al iniciar sesión' })
      throw err
    }
  }, [notify])

  const register = useCallback(async (username: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { data } = await authApi.register(username, email, password)
      localStorage.setItem('token', data.token)
      dispatch({ type: 'SET_USER', payload: data.user })
      notify('success', `¡Cuenta creada! Bienvenido, ${data.user.username}`)
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Error al registrarse' })
      throw err
    }
  }, [notify])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }, [])

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const { data } = await authApi.getProfile()
      dispatch({ type: 'SET_USER', payload: data.user })
    } catch {
      localStorage.removeItem('token')
    }
  }, [])

  const loadStores = useCallback(async () => {
    try {
      const { data } = await storeApi.getMine()
      dispatch({ type: 'SET_STORES', payload: data.stores })
    } catch (err: any) {
      console.error('Failed to load stores:', err)
    }
  }, [])

  const selectStore = useCallback(async (id: string) => {
    try {
      const { data } = await storeApi.getById(id)
      dispatch({ type: 'SET_ACTIVE_STORE', payload: data.store })
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Error al cargar tienda' })
    }
  }, [])

  const loadMarketOverview = useCallback(async () => {
    try {
      const [marketRes, districtRes] = await Promise.all([
        economyApi.getOverview(),
        economyApi.getDistricts()
      ])
      dispatch({ type: 'SET_MARKET_OVERVIEW', payload: marketRes.data.market })
      dispatch({ type: 'SET_DISTRICTS', payload: districtRes.data.districts })
    } catch (err) {
      console.error('Failed to load market data:', err)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadUser()
    loadMarketOverview()
  }, [loadUser, loadMarketOverview])

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      state.notifications.forEach(n => {
        if (now - n.timestamp > 5000) {
          dispatch({ type: 'DISMISS_NOTIFICATION', payload: n.id })
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state.notifications])

  return (
    <GameContext.Provider value={{
      state, dispatch,
      login, register, logout,
      loadUser, loadStores, selectStore, loadMarketOverview,
      notify
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}
