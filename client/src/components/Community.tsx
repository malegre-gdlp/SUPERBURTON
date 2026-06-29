import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { gameApi, socialApi } from '../api'
import './Community.css'

interface RankEntry {
  rank: number
  storeName: string
  ownerName: string
  district: string
  revenue: number
  sales: number
  customers: number
  rating: number
  isOpen: boolean
}

interface PlayerEntry {
  username: string
  level: number
  money: number
  reputation: number
}

interface Activity {
  id: string
  type: 'sale' | 'open' | 'levelup' | 'franchise' | 'event'
  message: string
  timestamp: number
  user: string
}

const districtEmojis: Record<string, string> = {
  barrio: '🏘️', ciudad: '🏙️', centro_comercial: '🏬', zona_exclusiva: '🌴'
}

export default function Community() {
  const { state, notify } = useGame()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [topPlayers, setTopPlayers] = useState<PlayerEntry[]>([])
  const [activeTab, setActiveTab] = useState<'stores' | 'players' | 'activity'>('stores')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await gameApi.getRanking()
      setRanking(data.ranking || [])
      setTopPlayers(data.topPlayers || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // Generate synthetic activities from ranking data (since we don't have a real activity log)
  useEffect(() => {
    if (ranking.length === 0 && topPlayers.length === 0) return

    const acts: Activity[] = []
    const now = Date.now()

    ranking.slice(0, 5).forEach((s, i) => {
      acts.push({
        id: `sale-${i}`,
        type: 'sale',
        message: `${s.storeName} facturó ${s.revenue.toFixed(0)}€ totales`,
        timestamp: now - i * 60000 * 3,
        user: s.ownerName
      })
    })

    topPlayers.slice(0, 5).forEach((p, i) => {
      if (p.level > 1) {
        acts.push({
          id: `level-${i}`,
          type: 'levelup',
          message: `${p.username} alcanzó nivel ${p.level}`,
          timestamp: now - i * 60000 * 5 - 30000,
          user: p.username
        })
      }
    })

    acts.sort((a, b) => b.timestamp - a.timestamp)
    setActivities(acts.slice(0, 20))
  }, [ranking, topPlayers])

  useEffect(() => { loadData() }, [loadData])

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#CD7F32'
    return 'var(--color-text-secondary)'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'ahora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  if (!state.user) {
    return (
      <div className="page community-page">
        <div className="container">
          <div className="empty-state" style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌍</div>
            <h2>Comunidad</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Inicia sesión para ver la comunidad
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page community-page">
      <div className="container">
        <div className="community-header">
          <h1>🌍 Comunidad</h1>
          <p className="text-secondary">Rankings, jugadores y actividad del mundo</p>
          <button className="btn btn-outline btn-sm" onClick={loadData} style={{ marginTop: 8 }}>
            🔄 Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="community-tabs">
          {([
            { key: 'stores', label: '🏪 Tiendas', icon: '🏪' },
            { key: 'players', label: '👥 Jugadores', icon: '👥' },
            { key: 'activity', label: '📡 Actividad', icon: '📡' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner" /> Cargando comunidad...
          </div>
        )}

        {/* ═══ STORE RANKINGS ═══ */}
        {activeTab === 'stores' && !loading && (
          <div className="card">
            <div className="ranking-header">
              <h3>🏪 Ranking de Tiendas</h3>
              <span className="ranking-subtitle">Top por facturación total</span>
            </div>
            {ranking.length === 0 ? (
              <div className="empty-ranking">
                <p>Aún no hay tiendas en el ranking.</p>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  ¡Crea tu tienda!
                </button>
              </div>
            ) : (
              <div className="ranking-list">
                {ranking.map(store => (
                  <div key={store.rank} className="ranking-row">
                    <div className="ranking-pos" style={{ color: getRankColor(store.rank) }}>
                      <span className="ranking-num">{getRankIcon(store.rank)}</span>
                    </div>
                    <div className="ranking-store-info">
                      <span className="ranking-store-name">{store.storeName}</span>
                      <span className="ranking-owner">
                        👤 {store.ownerName}
                        <span className="ranking-district">
                          {districtEmojis[store.district] || '📍'} {store.district}
                        </span>
                      </span>
                    </div>
                    <div className="ranking-stats">
                      <div className="ranking-stat">
                        <span className="ranking-stat-value">{store.revenue.toFixed(0)}€</span>
                        <span className="ranking-stat-label">Ingresos</span>
                      </div>
                      <div className="ranking-stat">
                        <span className="ranking-stat-value">{store.sales}</span>
                        <span className="ranking-stat-label">Ventas</span>
                      </div>
                      <div className="ranking-stat">
                        <span className="ranking-stat-value">{store.rating.toFixed(1)}</span>
                        <span className="ranking-stat-label">⭐</span>
                      </div>
                    </div>
                    <div className="ranking-status">
                      <span className={`badge ${store.isOpen ? 'badge-success' : 'badge-warning'}`}>
                        {store.isOpen ? '🟢' : '🔴'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PLAYER RANKINGS ═══ */}
        {activeTab === 'players' && !loading && (
          <div className="card">
            <div className="ranking-header">
              <h3>👥 Jugadores Top</h3>
              <span className="ranking-subtitle">Los que más dinero tienen</span>
            </div>
            {topPlayers.length === 0 ? (
              <div className="empty-ranking">
                <p>Aún no hay jugadores en el ranking.</p>
              </div>
            ) : (
              <div className="player-ranking-list">
                {topPlayers.map((player, i) => (
                  <div key={i} className="player-ranking-row">
                    <div className="player-pos">
                      <span className="player-rank-badge" style={{
                        background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--color-border)',
                        color: i < 3 ? '#fff' : 'var(--color-text-secondary)'
                      }}>
                        {getRankIcon(i + 1)}
                      </span>
                    </div>
                    <div className="player-avatar">
                      <div className="player-avatar-circle" style={{
                        background: `linear-gradient(135deg, hsl(${player.username.length * 40}, 70%, 60%), hsl(${player.username.length * 40 + 60}, 70%, 50%))`
                      }}>
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="player-info">
                      <span className="player-name">{player.username}</span>
                      <div className="player-details">
                        <span className="player-level">Nv.{player.level}</span>
                        <span className="player-rep">⭐ {player.reputation?.toFixed(0) || 0}</span>
                      </div>
                    </div>
                    <div className="player-money">
                      <span className="player-money-value">💰 {player.money.toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ACTIVITY FEED ═══ */}
        {activeTab === 'activity' && !loading && (
          <div className="card">
            <div className="ranking-header">
              <h3>📡 Actividad Reciente</h3>
              <span className="ranking-subtitle">Lo que pasa en el mundo</span>
            </div>
            {activities.length === 0 ? (
              <div className="empty-ranking">
                <p>Aún no hay actividad registrada.</p>
              </div>
            ) : (
              <div className="activity-list">
                {activities.map(act => (
                  <div key={act.id} className="activity-row animate-slideIn">
                    <div className="activity-icon">
                      {act.type === 'sale' ? '💰' : act.type === 'levelup' ? '⭐' : act.type === 'open' ? '🏪' : '📢'}
                    </div>
                    <div className="activity-content">
                      <span className="activity-user">{act.user}</span>
                      <span className="activity-message">{act.message}</span>
                    </div>
                    <span className="activity-time">{formatTime(act.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Your position card */}
        {state.user && ranking.length > 0 && (
          <div className="card your-rank-card">
            <h3>📊 Tu posición</h3>
            <div className="your-rank-grid">
              <div className="your-rank-item">
                <span className="your-rank-label">Tiendas</span>
                <span className="your-rank-value">{state.stores.length}</span>
              </div>
              <div className="your-rank-item">
                <span className="your-rank-label">Nivel</span>
                <span className="your-rank-value">{state.user.level}</span>
              </div>
              <div className="your-rank-item">
                <span className="your-rank-label">Dinero</span>
                <span className="your-rank-value">💰 {state.user.money.toFixed(0)}€</span>
              </div>
              <div className="your-rank-item">
                <span className="your-rank-label">Reputación</span>
                <span className="your-rank-value">{state.user.reputation?.toFixed(0) || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
