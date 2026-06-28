import React, { useEffect } from 'react'
import { useGame } from '../engine/GameContext'
import './Market.css'

export default function Market() {
  const { state, loadMarketOverview } = useGame()

  useEffect(() => {
    loadMarketOverview()
  }, [loadMarketOverview])

  const { marketOverview: m } = state

  if (!m) return <div className="page"><div className="container">Cargando mercado...</div></div>

  return (
    <div className="page market-page">
      <div className="container">
        <div className="market-header">
          <h1>🌍 Mercado Global</h1>
          <p className="text-secondary">Estado actual de la economía del juego</p>
        </div>

        <div className="grid grid-2">
          {/* Economic Indicators */}
          <div className="card">
            <h3>📈 Indicadores Económicos</h3>
            <div className="eco-list">
              <div className="eco-item">
                <div className="eco-info">
                  <span className="eco-label">Inflación</span>
                  <span className="eco-desc">Variación general de precios</span>
                </div>
                <span className={`eco-value ${m.inflationRate > 0.03 ? 'text-danger' : 'text-success'}`}>
                  {(m.inflationRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="eco-item">
                <div className="eco-info">
                  <span className="eco-label">Demanda Global</span>
                  <span className="eco-desc">Nivel de consumo general</span>
                </div>
                <span className="eco-value">{(m.globalDemand * 100).toFixed(0)}%</span>
              </div>
              <div className="eco-item">
                <div className="eco-info">
                  <span className="eco-label">Factor Estacional</span>
                  <span className="eco-desc">Ajuste por temporada</span>
                </div>
                <span className="eco-value">{m.seasonMultiplier.toFixed(2)}x</span>
              </div>
              <div className="eco-item">
                <div className="eco-info">
                  <span className="eco-label">Tiendas Activas</span>
                  <span className="eco-desc">Supermercados abiertos ahora</span>
                </div>
                <span className="eco-value">{m.totalActiveStores}</span>
              </div>
              <div className="eco-item">
                <div className="eco-info">
                  <span className="eco-label">Productos</span>
                  <span className="eco-desc">En el catálogo global</span>
                </div>
                <span className="eco-value">{m.totalProducts}</span>
              </div>
            </div>
          </div>

          {/* Active Events */}
          <div className="card">
            <h3>🎉 Eventos Activos</h3>
            {m.activeEvents.length === 0 ? (
              <p className="text-secondary">No hay eventos activos actualmente</p>
            ) : (
              <div className="events-list">
                {m.activeEvents.map((event, i) => (
                  <div key={i} className="event-card">
                    <div className="event-header">
                      <span className="event-name">
                        {event.type === 'promotion' ? '🏷️' : event.type === 'festivity' ? '🎊' : '🌞'}
                        {' '}{event.name}
                      </span>
                      <span className="badge badge-warning">{event.type}</span>
                    </div>
                    <div className="event-effects">
                      <div className="effect-row">
                        <span>Demanda</span>
                        <span className="effect-value up">×{event.effects.demandMultiplier.toFixed(1)}</span>
                      </div>
                      <div className="effect-row">
                        <span>Precios</span>
                        <span className={`effect-value ${event.effects.priceMultiplier < 1 ? 'down' : 'up'}`}>
                          ×{event.effects.priceMultiplier.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* District Profiles */}
          <div className="card">
            <h3>🏘️ Tipos de Barrio</h3>
            <div className="district-profiles">
              {m.districtTypes && Object.entries(m.districtTypes).map(([key, dist]) => (
                <div key={key} className="dp-item">
                  <div className="dp-header">
                    <span className="dp-name">{dist.name}</span>
                    <span className="dp-spending">{dist.maxSpendingPerCustomer}€/cliente</span>
                  </div>
                  <p className="dp-desc">{dist.description}</p>
                  <div className="dp-stats">
                    <span>📊 sensibilidad {(dist.priceSensitivity * 100).toFixed(0)}%</span>
                    <span>⭐ calidad {(dist.qualityExpectation * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How Pricing Works */}
          <div className="card">
            <h3>⚖️ Cómo funcionan los precios</h3>
            <div className="pricing-rules">
              <div className="rule-item">
                <h4>📦 Precio Mayorista</h4>
                <p>Al crear un producto de marca blanca, el juego calcula un rango justo basado en:</p>
                <ul>
                  <li>Coste de fabricación</li>
                  <li>Calidad del producto</li>
                  <li>Demanda del mercado</li>
                  <li>Competencia (más competencia = menor precio)</li>
                  <li>Rareza del producto</li>
                </ul>
              </div>
              <div className="rule-item">
                <h4>🏪 Precio de Venta (PVP)</h4>
                <p>Cada tienda tiene un rango de precios permitido según:</p>
                <ul>
                  <li>Precio mayorista del producto</li>
                  <li>Tipo de barrio (poder adquisitivo)</li>
                  <li>Nivel de la tienda</li>
                  <li>Reputación de la tienda</li>
                </ul>
              </div>
              <div className="rule-item warning">
                <h4>⚠️ Clientes Inteligentes</h4>
                <p>Los NPC comparan precio, calidad, marca y reputación. Si abusas de los precios:</p>
                <ul>
                  <li>No comprarán productos sobrevalorados</li>
                  <li>Tu reputación bajará</li>
                  <li>Llegarán menos clientes</li>
                  <li>Pueden producirse inspecciones</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
