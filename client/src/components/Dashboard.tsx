import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, economyApi, gameApi } from '../api'
import type { Store, DistrictType } from '../types'
import './Dashboard.css'

/* ── Helper: spawn floating coin text ── */
function spawnFloatingText(text: string, className = 'floating-text coins') {
  const el = document.createElement('div')
  el.className = className
  el.textContent = text
  el.style.left = (40 + Math.random() * 40) + '%'
  el.style.top = (30 + Math.random() * 30) + '%'
  el.style.fontSize = (20 + Math.random() * 12) + 'px'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1800)
}

/* ── Helper: spawn confetti pieces ── */
function spawnConfetti(count = 8) {
  const colors = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FFD700']
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = (20 + Math.random() * 60) + '%'
    el.style.top = (20 + Math.random() * 40) + '%'
    el.style.background = colors[Math.floor(Math.random() * colors.length)]
    el.style.animationDelay = (Math.random() * 0.3) + 's'
    el.style.width = (4 + Math.random() * 8) + 'px'
    el.style.height = (4 + Math.random() * 8) + 'px'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1600)
  }
}

export default function Dashboard() {
  const { state, dispatch, loadStores, notify } = useGame()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [newStore, setNewStore] = useState({ name: '', description: '', districtType: 'barrio' as DistrictType })
  const [creating, setCreating] = useState(false)
  const [ranking, setRanking] = useState<any[]>([])
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [autoTicking, setAutoTicking] = useState(false)
  const tickRef = useRef(false)

  useEffect(() => {
    if (state.user) { loadStores(); loadRanking() }
  }, [state.user, loadStores])

  /* Auto global tick every 60s */
  useEffect(() => {
    const iv = setInterval(async () => {
      if (tickRef.current) return
      tickRef.current = true
      try {
        const { data } = await gameApi.globalTick()
        if (data?.storeResults?.length > 0) {
          spawnConfetti(5)
          notify('info', `🌍 Tick global — Día ${data.day}: ${data.storesProcessed} tiendas, ${data.totalRevenue.toFixed(0)}€ facturados`)
          loadStores()
          loadRanking()
        }
      } catch { /* silent */ }
      finally { tickRef.current = false }
    }, 60000)
    return () => clearInterval(iv)
  }, [loadStores, notify])

  const loadRanking = useCallback(async () => {
    try {
      const { data } = await gameApi.getRanking()
      setRanking(data.ranking?.slice(0, 5) || [])
      setTopPlayers(data.topPlayers?.slice(0, 5) || [])
    } catch { /* ignore */ }
  }, [])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStore.name.trim()) return
    setCreating(true)
    try {
      const { data } = await storeApi.create(newStore)
      dispatch({ type: 'SET_STORES', payload: [...state.stores, data.store] })
      dispatch({ type: 'UPDATE_STORE', payload: data.store })
      notify('success', `🎉 ¡${data.store.name} creado!`)
      spawnConfetti(12)
      setShowCreate(false)
      setNewStore({ name: '', description: '', districtType: 'barrio' })
      navigate(`/store/${data.store._id}`)
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error al crear tienda')
    } finally {
      setCreating(false)
    }
  }

  const handleStoreTick = async (storeId: string) => {
    try {
      const { data } = await economyApi.tickStore(storeId)
      const result = data.result
      spawnFloatingText(`+${result.totalRevenue.toFixed(0)}€ 💰`)
      if (result.totalProfit > 50) spawnConfetti(4)
      notify('success',
        `🛒 ${result.customers} clientes | 💰 +${result.totalRevenue.toFixed(2)}€ ingresos | 📈 +${result.totalProfit.toFixed(2)}€ ganancia` +
        (result.rejectedPurchases.length > 0 ? ` | ⚠️ ${result.rejectedPurchases.length} rechazos` : '')
      )
      const storeRes = await storeApi.getById(storeId)
      dispatch({ type: 'UPDATE_STORE', payload: storeRes.data.store })
      loadRanking()
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error al procesar')
    }
  }

  const handleGlobalTick = async () => {
    setAutoTicking(true)
    try {
      const { data } = await gameApi.globalTick()
      if (data?.storeResults?.length > 0) {
        spawnConfetti(10)
        notify('success', `🌍 Tick global completado — Día ${data.day}`)
        data.storeResults.forEach((r: any) => {
          if (r.profit > 0) spawnFloatingText(`+${r.profit.toFixed(0)}€ ${r.storeName}`, 'floating-text coins')
        })
      } else {
        notify('info', '🌍 No hay tiendas abiertas para procesar')
      }
      loadStores()
      loadRanking()
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error en tick global')
    } finally {
      setAutoTicking(false)
    }
  }

  const districtIcons: Record<string, string> = {
    barrio: '🏘️',
    ciudad: '🏙️',
    centro_comercial: '🏬',
    zona_exclusiva: '🌴'
  }

  return (
    <div className="page dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Mis Tiendas</h1>
            <p className="text-secondary">
              Nivel {state.user?.level} • 💰 {state.user?.money.toFixed(2)} €
            </p>
            {/* User XP Bar */}
            <div className="user-xp-bar">
              <div className="user-xp-track">
                <div className="user-xp-fill" style={{
                  width: state.user ? Math.min(100, ((state.user.experience || 0) / (state.user.experienceToNextLevel || 500)) * 100) + '%' : '0%'
                }} />
              </div>
              <span className="user-xp-text">
                {state.user?.experience || 0} / {state.user?.experienceToNextLevel || 500} XP
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Nueva Tienda
          </button>
        </div>

        {/* Economy Overview */}
        {state.marketOverview && (
          <div className="market-status card">
            <div className="market-status-header">
              <h3>📊 Estado del Mercado</h3>
            </div>
            <div className="market-status-grid">
              <div className="ms-item">
                <span className="ms-label">Inflación</span>
                <span className="ms-value">{(state.marketOverview.inflationRate * 100).toFixed(1)}%</span>
              </div>
              <div className="ms-item">
                <span className="ms-label">Demanda global</span>
                <span className="ms-value">{(state.marketOverview.globalDemand * 100).toFixed(0)}%</span>
              </div>
              <div className="ms-item">
                <span className="ms-label">Temporada</span>
                <span className="ms-value">{(state.marketOverview.seasonMultiplier).toFixed(2)}x</span>
              </div>
              <div className="ms-item">
                <span className="ms-label">Tiendas activas</span>
                <span className="ms-value">{state.marketOverview.totalActiveStores}</span>
              </div>
              {state.marketOverview.activeEvents.map((e, i) => (
                <div key={i} className="ms-item ms-event">
                  <span className="ms-label">🎉 {e.name}</span>
                  <span className="ms-value">
                    {(e.effects.demandMultiplier).toFixed(1)}x demanda
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store List */}
        {state.stores.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">🏪</div>
            <h3>¡Crea tu primer supermercado!</h3>
            <p>Elige una ubicación y empieza a construir tu imperio</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
              Crear mi tienda
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {state.stores.map(store => (
              <div key={store._id} className="store-card card animate-fadeIn">
                <div className="store-card-header">
                  <div className="store-card-info">
                    <h3>{store.name}</h3>
                    <span className="store-district">
                      {districtIcons[store.districtType]} {store.districtName}
                    </span>
                  </div>
                  <span className={`badge ${store.isOpen ? 'badge-success' : 'badge-warning'}`}>
                    {store.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>

                <div className="store-card-stats">
                  <div className="store-stat">
                    <span className="stat-num">{store.stats.rating.toFixed(1)}</span>
                    <span className="stat-desc">⭐ Valoración</span>
                  </div>
                  <div className="store-stat">
                    <span className="stat-num">{store.stats.totalCustomers}</span>
                    <span className="stat-desc">Clientes</span>
                  </div>
                  <div className="store-stat">
                    <span className="stat-num">{store.shelves.length}</span>
                    <span className="stat-desc">Estanterías</span>
                  </div>
                  <div className="store-stat">
                    <span className="stat-num">{store.employees.length}</span>
                    <span className="stat-desc">Empleados</span>
                  </div>
                </div>

                <div className="store-card-details">
                  <div className="detail-row">
                    <span>Reputación de precios:</span>
                    <div className="reputation-bar">
                      <div
                        className="reputation-fill"
                        style={{
                          width: `${store.stats.priceFairnessReputation}%`,
                          background: store.stats.priceFairnessReputation > 50
                            ? 'var(--color-primary)' : 'var(--color-warning)'
                        }}
                      />
                    </div>
                    <span className="reputation-text">{store.stats.priceFairnessReputation.toFixed(0)}%</span>
                  </div>
                  <div className="detail-row">
                    <span>Satisfacción:</span>
                    <span className={store.stats.customerSatisfaction > 50 ? 'text-success' : 'text-warning'}>
                      {store.stats.customerSatisfaction.toFixed(0)}%
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Gasto medio:</span>
                    <span>{store.stats.averageBasketSize.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="store-card-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/store/${store._id}`)}
                  >
                    Gestionar
                  </button>
                  <button
                    className={`btn ${store.isOpen ? 'btn-danger' : 'btn-success'}`}
                    onClick={async () => {
                      try {
                        const { data } = await storeApi.toggleOpen(store._id)
                        dispatch({ type: 'UPDATE_STORE', payload: data.store })
                        notify('info', `${store.name}: ${data.store.isOpen ? 'Abierto' : 'Cerrado'}`)
                      } catch (err: any) {
                        notify('error', 'Error al cambiar estado')
                      }
                    }}
                  >
                    {store.isOpen ? 'Cerrar' : 'Abrir'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleStoreTick(store._id)}
                  >
                    Simular clientes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Store Modal */}
        {/* ═══ RANKING / COMMUNITY SECTION ═══ */}
        {state.stores.length > 0 && (
          <div className="dashboard-community">
            <div className="dashboard-community-header">
              <h3>🌍 Comunidad</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/community')}>
                Ver todo →
              </button>
            </div>
            <div className="grid grid-2">
              {/* Mini Ranking */}
              <div className="card mini-ranking">
                <h4>🏪 Top Tiendas</h4>
                {ranking.length === 0 ? (
                  <p className="text-secondary" style={{ fontSize: 13 }}>Cargando ranking...</p>
                ) : (
                  <div className="mini-ranking-list">
                    {ranking.map((s: any, i: number) => (
                      <div key={i} className="mini-ranking-row">
                        <span className="mini-rank-num" style={{
                          color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--color-text-light)'
                        }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div className="mini-rank-info">
                          <span className="mini-rank-name">{s.storeName}</span>
                          <span className="mini-rank-owner">👤 {s.ownerName}</span>
                        </div>
                        <div className="mini-rank-revenue">
                          <span className="mini-rank-val">{s.revenue.toFixed(0)}€</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/community')}>
                  🌍 Ir a la comunidad
                </button>
              </div>

              {/* Mini Players */}
              <div className="card mini-players">
                <h4>👥 Top Jugadores</h4>
                {topPlayers.length === 0 ? (
                  <p className="text-secondary" style={{ fontSize: 13 }}>Cargando jugadores...</p>
                ) : (
                  <div className="mini-players-list">
                    {topPlayers.map((p: any, i: number) => (
                      <div key={i} className="mini-player-row">
                        <span className="mini-player-avatar" style={{
                          background: `linear-gradient(135deg, hsl(${p.username.length * 40}, 70%, 60%), hsl(${p.username.length * 40 + 60}, 70%, 50%))`
                        }}>
                          {p.username.charAt(0).toUpperCase()}
                        </span>
                        <div className="mini-player-info">
                          <span className="mini-player-name">{p.username}</span>
                          <span className="mini-player-level">Nv.{p.level}</span>
                        </div>
                        <span className="mini-player-money">💰 {p.money.toFixed(0)}€</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions row */}
            <div className="quick-actions-row">
              <button className="btn btn-primary" onClick={handleGlobalTick} disabled={autoTicking}>
                {autoTicking ? '⏳ Procesando...' : '🌍 Tick Global'}
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/catalog')}>
                📦 Catálogo
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/market')}>
                📊 Mercado
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏪 Nueva Tienda</h2>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateStore}>
                <div className="form-group">
                  <label>Nombre de la tienda</label>
                  <input
                    value={newStore.name}
                    onChange={e => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="Mi Supermercado"
                    maxLength={50}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={newStore.description}
                    onChange={e => setNewStore({ ...newStore, description: e.target.value })}
                    placeholder="Describe tu tienda..."
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Ubicación / Tipo de barrio</label>
                  <p className="form-hint">
                    El barrio determina el poder adquisitivo de los clientes
                  </p>
                  <div className="district-selector">
                    {state.districts && Object.entries(state.districts).map(([key, dist]) => (
                      <label
                        key={key}
                        className={`district-option ${newStore.districtType === key ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="districtType"
                          value={key}
                          checked={newStore.districtType === key}
                          onChange={() => setNewStore({ ...newStore, districtType: key as DistrictType })}
                        />
                        <div className="district-option-content">
                          <span className="district-option-name">
                            {districtIcons[key]} {dist.name}
                          </span>
                          <span className="district-option-range">
                            {Object.values(dist.levelSpending)[0]?.min || 1}€ - {Object.values(dist.levelSpending).pop()?.max || 30}€ por cliente
                          </span>
                          <span className="district-option-desc">{dist.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={creating}>
                  {creating ? 'Creando...' : '¡Crear tienda!'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
