import React from 'react'
import { useGame } from '../engine/GameContext'
import './Franchises.css'

export default function Franchises() {
  const { state, notify } = useGame()
  const storeLevel = state.stores?.length > 0
    ? Math.max(...state.stores.map((s:any) => s.level || 1))
    : state.user?.level || 1

  const franchiseTiers = [
    { name: 'Bronce', minStores: 1, benefit: '5% descuento proveedores', color: '#cd7f32' },
    { name: 'Plata', minStores: 3, benefit: '10% descuento + marketing básico', color: '#c0c0c0' },
    { name: 'Oro', minStores: 5, benefit: '15% descuento + marketing premium', color: '#ffd700' },
    { name: 'Platino', minStores: 10, benefit: '25% descuento + exclusividad regional', color: '#e5e4e2' }
  ]

  return (
    <div className="page franchises-page">
      <div className="container">
        <div className="franchises-header">
          <h1>🏢 Franquicias</h1>
          <p className="text-secondary">Expande tu imperio con franquicias gestionadas por otros jugadores</p>
        </div>

        <div className="grid grid-2">
          {/* How it works */}
          <div className="card">
            <h3>📖 ¿Cómo funcionan?</h3>
            <div className="franchise-steps">
              <div className="step">
                <span className="step-num">1</span>
                <div>
                  <h4>Alcanza el nivel 15</h4>
                  <p>Desbloquea la posibilidad de crear una cadena de franquicias.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <div>
                  <h4>Conviértete en franquiciador</h4>
                  <p>Otros jugadores podrán solicitar abrir una franquicia de tu marca.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <div>
                  <h4>Establece los términos</h4>
                  <p>Define el porcentaje de ingresos, canon fijo y duración del contrato.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">4</span>
                <div>
                  <h4>Gana royalties</h4>
                  <p>Recibe un porcentaje de los beneficios de todas tus franquicias.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tiers */}
          <div className="card">
            <h3>🏆 Categorías de Franquicia</h3>
            <div className="tiers-list">
              {franchiseTiers.map((tier, i) => (
                <div key={i} className="tier-card" style={{ borderColor: tier.color }}>
                  <div className="tier-header">
                    <span className="tier-name" style={{ color: tier.color }}>{tier.name}</span>
                    <span className="tier-min">{tier.minStores}+ tiendas</span>
                  </div>
                  <p className="tier-benefit">{tier.benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits for Franchisor */}
          <div className="card">
            <h3>👑 Beneficios para el franquiciador</h3>
            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <div>
                  <h4>Ingresos pasivos</h4>
                  <p>Ganas un porcentaje de todas las ventas de tus franquicias</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📈</span>
                <div>
                  <h4>Reconocimiento de marca</h4>
                  <p>Tu marca aparece en más ubicaciones sin invertir tú mismo</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <div>
                  <h4>Expansión sin límites</h4>
                  <p>No hay límite de franquicias que puedas gestionar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits for Franchisee */}
          <div className="card">
            <h3>🎯 Beneficios para el franquiciado</h3>
            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">🏪</span>
                <div>
                  <h4>Marca reconocida</h4>
                  <p>Empieza con una marca que los clientes ya conocen y confían</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📦</span>
                <div>
                  <h4>Productos exclusivos</h4>
                  <p>Acceso a productos que solo vende tu cadena de franquicias</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📢</span>
                <div>
                  <h4>Marketing incluido</h4>
                  <p>Campañas de marketing y decoración de la marca incluidas</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🏷️</span>
                <div>
                  <h4>Descuentos en proveedores</h4>
                  <p>Hasta 25% de descuento según la categoría de la franquicia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {storeLevel < 10 && (
          <div className="level-requirement card">
            <span className="lock-icon">🔒</span>
            <div>
              <h3>Franquicias bloqueadas</h3>
              <p>Alcanza el nivel 10 de tienda para abrir franquicias. Nivel actual: {storeLevel}</p>
              <div className="level-bar">
                <div className="level-fill-bar" style={{ width: `${Math.min(100, (storeLevel / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
        )}

        {storeLevel >= 10 && (
          <div className="card franchise-action">
            <h3>🏪 Tus tiendas como franquiciables</h3>
            <p>Tus tiendas pueden convertirse en marcas franquiciables. Configúralo desde la gestión de cada tienda.</p>
            <div className="franchise-stores-list">
              {state.stores.map(store => (
                <div key={store._id} className="fs-item">
                  <span className="fs-name">{store.name}</span>
                  <span className="fs-district">{store.districtName}</span>
                  <span className="fs-rating">⭐ {store.stats.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
