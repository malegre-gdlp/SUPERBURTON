import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, economyApi, catalogApi } from '../api'
import type { Store, DistrictType } from '../types'
import './Dashboard.css'

export default function Dashboard() {
  const { state, dispatch, loadStores, selectStore, notify } = useGame()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [newStore, setNewStore] = useState({ name: '', description: '', districtType: 'barrio' as DistrictType })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (state.user) loadStores()
  }, [state.user, loadStores])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStore.name.trim()) return
    setCreating(true)
    try {
      const { data } = await storeApi.create(newStore)
      dispatch({ type: 'SET_STORES', payload: [...state.stores, data.store] })
      dispatch({ type: 'UPDATE_STORE', payload: data.store })
      notify('success', `¡${data.store.name} creado!`)
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
      notify('info',
        `🛒 ${result.customers} clientes | 💰 ${result.totalRevenue.toFixed(2)}€ ingresos` +
        (result.rejectedPurchases.length > 0 ? ` | ⚠️ ${result.rejectedPurchases.length} compras rechazadas` : '')
      )
      // Reload store
      const storeRes = await storeApi.getById(storeId)
      dispatch({ type: 'UPDATE_STORE', payload: storeRes.data.store })
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error al procesar')
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
