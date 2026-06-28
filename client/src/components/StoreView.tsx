import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, catalogApi, economyApi } from '../api'
import type { Store, Product, PriceRange, DistrictProfile } from '../types'
import './StoreView.css'

export default function StoreView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch, notify } = useGame()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [catalog, setCatalog] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'shelves' | 'products' | 'employees' | 'warehouse'>('overview')
  const [tickResult, setTickResult] = useState<any>(null)

  useEffect(() => {
    if (id) loadStore()
  }, [id])

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadStore = async () => {
    try {
      const { data } = await storeApi.getById(id!)
      setStore(data.store)
    } catch {
      notify('error', 'Tienda no encontrada')
      navigate('/dashboard')
    }
  }

  const loadCatalog = async () => {
    try {
      const { data } = await catalogApi.getAll({})
      setCatalog(data.products)
    } catch {}
  }

  const handleTick = async () => {
    if (!store) return
    try {
      const { data } = await economyApi.tickStore(store._id)
      setTickResult(data.result)
      notify('success', `🛒 ${data.result.customers} clientes atendidos`)
      loadStore()
    } catch (err: any) {
      notify('error', 'Error al simular')
    }
  }

  const handleSetPrice = async (shelfIndex: number, productIndex: number, newPrice: number) => {
    if (!store) return
    const updated = { ...store }
    updated.shelves[shelfIndex].products[productIndex].price = newPrice
    try {
      const { data } = await storeApi.update(store._id, { shelves: updated.shelves } as any)
      setStore(data.store)
      notify('info', 'Precio actualizado')
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error al actualizar precio')
    }
  }

  const getProductById = (pid: string) => catalog.find(p => p._id === pid)

  if (!store) return <div className="page"><div className="container">Cargando tienda...</div></div>

  const districtEmojis: Record<string, string> = {
    barrio: '🏘️', ciudad: '🏙️', centro_comercial: '🏬', zona_exclusiva: '🌴'
  }

  return (
    <div className="page store-view">
      <div className="container">
        <div className="store-header">
          <div>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Volver</button>
            <h1>{store.name}</h1>
            <div className="store-meta">
              <span>{districtEmojis[store.districtType]} {store.districtName}</span>
              <span>⭐ {store.stats.rating.toFixed(1)}</span>
              <span>💰 {store.stats.totalRevenue.toFixed(2)} € ingresos</span>
              <span className={`badge ${store.isOpen ? 'badge-success' : 'badge-warning'}`}>
                {store.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
              </span>
            </div>
          </div>
          <div className="store-header-actions">
            <button className="btn btn-secondary" onClick={handleTick}>
              🛒 Simular clientes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="store-tabs">
          {(['overview', 'shelves', 'products', 'warehouse', 'employees'] as const).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📊'}
              {tab === 'shelves' && '🏗️'}
              {tab === 'products' && '📦'}
              {tab === 'warehouse' && '📋'}
              {tab === 'employees' && '👥'}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="store-content">
          {activeTab === 'overview' && (
            <div className="grid grid-2">
              <div className="card">
                <h3>📊 Estadísticas</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.totalCustomers}</span>
                    <span>Clientes totales</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.totalSales}</span>
                    <span>Ventas totales</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.totalRevenue.toFixed(0)}€</span>
                    <span>Ingresos totales</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.rating.toFixed(1)}⭐</span>
                    <span>Valoración</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.customerSatisfaction.toFixed(0)}%</span>
                    <span>Satisfacción</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.priceFairnessReputation.toFixed(0)}%</span>
                    <span>Reputación precios</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.stats.averageBasketSize.toFixed(2)}€</span>
                    <span>Gasto medio</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-big">{store.customerLoyalty.toFixed(0)}</span>
                    <span>Fidelidad</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3>🏘️ Perfil del barrio</h3>
                <div className="district-info">
                  <p><strong>Ubicación:</strong> {districtEmojis[store.districtType]} {store.districtName}</p>
                  <p><strong>Estanterías:</strong> {store.shelves.length}</p>
                  <p><strong>Empleados:</strong> {store.employees.length}</p>
                  <p><strong>Productos en tienda:</strong> {store.shelves.reduce((t, s) => t + s.products.reduce((p, sp) => p + sp.quantity, 0), 0)}</p>
                </div>
                {tickResult && (
                  <div className="tick-result">
                    <h4>🛒 Última simulación</h4>
                    <div className="tick-grid">
                      <div className="tick-item">
                        <span className="tick-label">Clientes</span>
                        <span className="tick-value">{tickResult.customers}</span>
                      </div>
                      <div className="tick-item">
                        <span className="tick-label">Ventas</span>
                        <span className="tick-value">{tickResult.totalSales} uds</span>
                      </div>
                      <div className="tick-item">
                        <span className="tick-label">Ingresos</span>
                        <span className="tick-value">{tickResult.totalRevenue.toFixed(2)}€</span>
                      </div>
                      <div className="tick-item">
                        <span className="tick-label">Beneficio</span>
                        <span className="tick-value">{tickResult.totalProfit.toFixed(2)}€</span>
                      </div>
                      <div className="tick-item">
                        <span className="tick-label">Gasto medio</span>
                        <span className="tick-value">{tickResult.averageBasketSize.toFixed(2)}€</span>
                      </div>
                      <div className="tick-item">
                        <span className="tick-label">Rechazos</span>
                        <span className="tick-value">{tickResult.rejectedPurchases?.length || 0}</span>
                      </div>
                    </div>
                    {tickResult.rejectedPurchases?.length > 0 && (
                      <div className="rejected-list">
                        <h5>⚠️ Compras rechazadas (precio excesivo)</h5>
                        {tickResult.rejectedPurchases.map((r: any, i: number) => (
                          <div key={i} className="rejected-item">
                            <span>{r.productName}</span>
                            <span>{r.price.toFixed(2)}€</span>
                            <span className="rejected-reason">{r.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shelves' && (
            <div className="card">
              <h3>🏗️ Estanterías</h3>
              <div className="shelf-grid">
                {store.shelves.map((shelf, si) => (
                  <div key={si} className="shelf-card">
                    <div className="shelf-header">
                      <span className="shelf-type">{shelf.type}</span>
                      <span className="shelf-category">{shelf.category}</span>
                    </div>
                    <div className="shelf-products">
                      {shelf.products.map((sp, pi) => {
                        const product = getProductById(sp.productId)
                        return (
                          <div key={pi} className="shelf-product-item">
                            <span className="sp-name">{product?.name || 'Unknown'}</span>
                            <span className="sp-qty">{sp.quantity}/{sp.maxCapacity}</span>
                            <div className="sp-price-edit">
                              <input
                                type="number"
                                step="0.01"
                                value={sp.price}
                                onChange={e => handleSetPrice(si, pi, parseFloat(e.target.value) || 0)}
                              />
                              <span>€</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="card">
              <h3>📦 Catálogo de productos</h3>
              <div className="catalog-grid">
                {catalog.slice(0, 50).map(product => (
                  <div key={product._id} className="product-card-sm">
                    <div className="product-sm-header">
                      <span className="product-sm-name">{product.name}</span>
                      <span className="product-sm-brand">{product.brand}</span>
                    </div>
                    <div className="product-sm-details">
                      <span>Calidad: {product.quality}/100</span>
                      <span>Mayorista: {product.wholesalePrice.toFixed(2)}€</span>
                      <span>PVP ref: {product.basePrice.toFixed(2)}€</span>
                    </div>
                    <div className="product-sm-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={async () => {
                          await storeApi.addToWarehouse(store._id, {
                            productId: product._id,
                            quantity: 10,
                            purchasePrice: product.wholesalePrice
                          })
                          notify('success', `${product.name} añadido al almacén`)
                          loadStore()
                        }}
                      >
                        + Añadir al almacén
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'warehouse' && (
            <div className="card">
              <h3>📋 Almacén</h3>
              <div className="warehouse-list">
                {store.warehouse.map((w, i) => {
                  const product = getProductById(w.productId)
                  return (
                    <div key={i} className="warehouse-item">
                      <span className="wh-name">{product?.name || 'Unknown'}</span>
                      <span className="wh-qty">Stock: {w.quantity}</span>
                      <span className="wh-price">Coste: {w.purchasePrice.toFixed(2)}€</span>
                    </div>
                  )
                })}
                {store.warehouse.length === 0 && (
                  <p className="empty-note">El almacén está vacío. Añade productos desde el catálogo.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="card">
              <h3>👥 Empleados</h3>
              <div className="employees-list">
                {store.employees.map((emp, i) => (
                  <div key={i} className="employee-card">
                    <div className="emp-header">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-role">{emp.role}</span>
                    </div>
                    <div className="emp-details">
                      <span>Salario: {emp.salary.toFixed(0)}€</span>
                      <span>Eficiencia: {(emp.efficiency * 100).toFixed(0)}%</span>
                      <span>Felicitad: {emp.happiness}%</span>
                    </div>
                  </div>
                ))}
                {store.employees.length === 0 && (
                  <p className="empty-note">No tienes empleados. Puedes contratarlos desde la gestión de la tienda.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
