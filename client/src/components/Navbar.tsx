import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import './Navbar.css'

export default function Navbar() {
  const { state, logout } = useGame()
  const navigate = useNavigate()

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
          <Link to="/catalog" className="nav-link">Catálogo</Link>
          <Link to="/market" className="nav-link">Mercado</Link>

          {state.user ? (
            <>
              <Link to="/dashboard" className="nav-link">Mi Tienda</Link>
              <Link to="/white-label" className="nav-link">Marca Blanca</Link>
              <Link to="/franchises" className="nav-link">Franquicias</Link>
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
