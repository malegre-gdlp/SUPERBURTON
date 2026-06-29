import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { gameApi } from '../api'
import './Navbar.css'

export default function Navbar() {
  const { state, logout } = useGame()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState({ day: 1, timeString: '08:00', weather: 'soleado', season: 'verano' })
  const maxStoreLevel = state.stores?.length > 0 
    ? Math.max(...state.stores.map((s: any) => (s as any).level || 1))
    : state.user?.level || 1

  useEffect(() => {
    const loadDay = async () => {
      try { const { data } = await gameApi.getState(); setGameState({ day: data.day, timeString: data.timeString, weather: data.weather, season: data.season }) } catch {}
    }
    loadDay()
    const iv = setInterval(loadDay, 30000)
    return () => clearInterval(iv)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-text">SuperMarket<span className="brand-accent">Sim</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/catalog" className="nav-link">📦 Catálogo</Link>
          <Link to="/market" className="nav-link">📊 Mercado</Link>
          <Link to="/community" className="nav-link">🌍 Comunidad</Link>

          {state.user ? (
            <>
              <Link to="/dashboard" className="nav-link">Mi Tienda</Link>
              {maxStoreLevel >= 5 && <Link to="/white-label" className="nav-link">🏷️ Marca Blanca</Link>}
              {maxStoreLevel >= 10 && <Link to="/franchises" className="nav-link">🏢 Franquicias</Link>}
              <span className="nav-game-day" title={`Día ${gameState.day} · ${gameState.season}`}>
                📅 D{gameState.day} · 🕐 {gameState.timeString}
                <span style={{marginLeft:4}}>
                  {gameState.weather === 'soleado' ? '☀️' : gameState.weather === 'nublado' ? '☁️' : gameState.weather === 'lluvioso' ? '🌧️' : gameState.weather === 'tormenta' ? '⛈️' : '❄️'}
                </span>
              </span>
              <div className="nav-user">
                <div className="nav-user-info">
                  <span className="nav-level">Nv.{state.user.level}</span>
                  <span className="nav-username">{state.user.username}</span>
                  <span className="nav-money">💰 {state.user.money.toFixed(2)} €</span>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  Salir
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Registro</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
