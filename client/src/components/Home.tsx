import React from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import './Home.css'

export default function Home() {
  const { state } = useGame()

  const features = [
    { icon: '🏪', title: 'Gestiona tu tienda', desc: 'Diseña el local, coloca estanterías, contrata empleados y gestiona tu almacén.' },
    { icon: '💰', title: 'Economía dinámica', desc: 'Oferta y demanda real, inflación, productos de temporada y eventos.' },
    { icon: '🏷️', title: 'Marca Blanca', desc: 'Crea tus propios productos, diseña el logotipo y cobra royalties.' },
    { icon: '🏢', title: 'Franquicias', desc: 'Expande tu negocio con franquicias gestionadas por otros jugadores.' },
    { icon: '🌍', title: 'Mundo Online', desc: 'Visita tiendas de otros jugadores, comercia y participa en ferias.' },
    { icon: '🎉', title: 'Eventos', desc: 'Black Friday, Navidad, Halloween y muchas más campañas.' },
  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🛒 SuperMarket Simulator Online</span>
          <h1 className="hero-title">
            Construye tu <span className="text-accent">imperio</span> del supermercado
          </h1>
          <p className="hero-subtitle">
            Gestiona tu propio supermercado, compite con otros jugadores,
            crea tu marca blanca y expande tu negocio con franquicias.
            ¡Todo en un mundo virtual vivo!
          </p>
          <div className="hero-actions">
            {state.user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Ir a mi tienda 🏪
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Empezar a jugar 🎮
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-supermarket">
            <div className="hero-store-front">
              <div className="store-sign">SUPERMARKET</div>
              <div className="store-windows">
                <div className="store-window" />
                <div className="store-window" />
                <div className="store-window" />
              </div>
              <div className="store-entrance">
                <span className="entrance-text">ENTRAR</span>
              </div>
            </div>
            <div className="hero-items">
              <span className="hero-item" style={{ animationDelay: '0s' }}>🍎</span>
              <span className="hero-item" style={{ animationDelay: '0.3s' }}>🥛</span>
              <span className="hero-item" style={{ animationDelay: '0.6s' }}>🧀</span>
              <span className="hero-item" style={{ animationDelay: '0.9s' }}>🥖</span>
              <span className="hero-item" style={{ animationDelay: '1.2s' }}>🧃</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {state.marketOverview && (
        <section className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{state.marketOverview.totalActiveStores}</span>
            <span className="stat-label">Tiendas activas</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{state.marketOverview.totalProducts}</span>
            <span className="stat-label">Productos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{(state.marketOverview.inflationRate * 100).toFixed(1)}%</span>
            <span className="stat-label">Inflación</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{state.marketOverview.seasonMultiplier.toFixed(1)}x</span>
            <span className="stat-label">Demanda estacional</span>
          </div>
          {state.marketOverview.activeEvents.map((e, i) => (
            <div key={i} className="stat-item stat-event">
              <span className="stat-value">🎉</span>
              <span className="stat-label">{e.name}</span>
            </div>
          ))}
        </section>
      )}

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">¿Qué puedes hacer?</h2>
        <div className="grid grid-3">
          {features.map((f, i) => (
            <div key={i} className="feature-card card animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Districts */}
      <section className="districts-section">
        <h2 className="section-title">Tipos de barrio</h2>
        <p className="section-subtitle">Cada ubicación tiene clientes con diferente poder adquisitivo</p>
        <div className="grid grid-4">
          {state.districts && Object.entries(state.districts).map(([key, dist], i) => (
            <div key={key} className="district-card card animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="district-header">
                <span className="district-name">{dist.name}</span>
                <span className="district-levels">
                  {Object.values(dist.levelSpending)[0]?.min || 1}€ - {Object.values(dist.levelSpending).pop()?.max || 30}€
                </span>
              </div>
              <p className="district-desc">{dist.description}</p>
              <div className="district-stats">
                <span>💰 hasta {dist.maxSpendingPerCustomer}€/cliente</span>
                <span>📊 sensibilidad {(dist.priceSensitivity * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>SuperMarket Simulator Online — Un mundo de oportunidades comerciales 🛒</p>
      </footer>
    </div>
  )
}
