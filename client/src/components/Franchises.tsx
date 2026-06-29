import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import './Franchises.css'

/* ── Helper: confetti ── */
function popConfetti(count = 6) {
  const colors = ['#4CAF50','#FF9800','#2196F3','#F44336','#9C27B0','#FFD700']
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

const franchiseTiers = [
  { name: 'Bronce', minStores: 1, benefit: '5% descuento proveedores', revenueShare: 5, color: '#cd7f32', icon: '🥉' },
  { name: 'Plata', minStores: 3, benefit: '10% descuento + marketing básico', revenueShare: 8, color: '#c0c0c0', icon: '🥈' },
  { name: 'Oro', minStores: 5, benefit: '15% descuento + marketing premium', revenueShare: 12, color: '#ffd700', icon: '🥇' },
  { name: 'Platino', minStores: 10, benefit: '25% descuento + exclusividad regional', revenueShare: 15, color: '#e5e4e2', icon: '💎' }
]

const licenseTypes = [
  { id: 'basic', name: 'Licencia Básica', price: 500, duration: '7 días', benefit: 'Usar nombre de marca', icon: '📋' },
  { id: 'premium', name: 'Licencia Premium', price: 2000, duration: '30 días', benefit: 'Nombre + productos exclusivos', icon: '⭐' },
  { id: 'elite', name: 'Licencia Élite', price: 5000, duration: '90 días', benefit: 'Marca completa + marketing + soporte', icon: '👑' },
]

export default function Franchises() {
  const { state, notify } = useGame()
  const navigate = useNavigate()
  const storeLevel = state.stores?.length > 0
    ? Math.max(...state.stores.map((s:any) => s.level || 1))
    : state.user?.level || 1
  const [activeTab, setActiveTab] = useState<'franchises' | 'licenses'>('franchises')
  const [showBuyLicense, setShowBuyLicense] = useState<string | null>(null)

  const userTier = franchiseTiers.filter(t => state.stores.length >= t.minStores).pop() || franchiseTiers[0]

  const handleBuyLicense = (licenseId: string) => {
    const lic = licenseTypes.find(l => l.id === licenseId)
    if (!lic) return
    if ((state.user?.money || 0) < lic.price) {
      notify('error', `❌ Necesitas ${lic.price}€, tienes ${state.user?.money.toFixed(2)||0}€`)
      return
    }
    notify('success', `🎉 ¡${lic.name} adquirida! ${lic.benefit}`)
    popConfetti(8)
    setShowBuyLicense(null)
  }

  return (
    <div className="page franchises-page">
      <div className="container">
        <div className="franchises-header">
          <h1>🏢 Franquicias & Licencias</h1>
          <p className="text-secondary">Expande tu imperio, licencia tu marca y gestiona tu red</p>
        </div>

        {/* Tabs */}
        <div className="community-tabs" style={{marginBottom:20}}>
          <button className={`tab-btn ${activeTab === 'franchises' ? 'active' : ''}`} onClick={() => setActiveTab('franchises')}>
            🏪 Franquicias
          </button>
          <button className={`tab-btn ${activeTab === 'licenses' ? 'active' : ''}`} onClick={() => setActiveTab('licenses')}>
            📜 Licencias
          </button>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* FRANCHISES TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'franchises' && <>

        <div className="grid grid-2">
          {/* How it works */}
          <div className="card">
            <h3>📖 ¿Cómo funcionan?</h3>
            <div className="franchise-steps">
              <div className="step">
                <span className="step-num">1</span>
                <div>
                  <h4>Alcanza el nivel 10+</h4>
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
                  <h4>Cobra royalties</h4>
                  <p>Recibe un porcentaje de los beneficios de todas tus franquicias.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className="card">
            <h3>🏆 Tu categoría</h3>
            <div className="current-tier-display" style={{borderColor: userTier.color}}>
              <span className="current-tier-icon">{userTier.icon}</span>
              <div className="current-tier-info">
                <span className="current-tier-name" style={{color:userTier.color}}>{userTier.name}</span>
                <span className="current-tier-rev">{userTier.revenueShare}% de royalty por ventas</span>
              </div>
            </div>
            <div className="tier-progress-bar">
              {franchiseTiers.map((tier, i) => {
                const unlocked = state.stores.length >= tier.minStores
                const nextTier = franchiseTiers[i + 1]
                const progress = nextTier ? (state.stores.length / nextTier.minStores) * 100 : 100
                return (
                  <div key={i} className={`tier-dot ${unlocked ? 'unlocked' : ''}`} style={{borderColor: unlocked ? tier.color : 'var(--color-border)'}}>
                    <span>{tier.icon}</span>
                    <span className="tier-dot-label">{tier.name}</span>
                  </div>
                )
              })}
            </div>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:8}}>
              {state.stores.length} / {franchiseTiers.filter(t => t.minStores > state.stores.length)[0]?.minStores || 'MAX'} tiendas para siguiente nivel
            </p>
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
            <h3>🏪 Tus tiendas</h3>
            <p>Tus tiendas pueden convertirse en marcas franquiciables.</p>
            <div className="franchise-stores-list">
              {state.stores.map(store => (
                <div key={store._id} className="fs-item" onClick={() => navigate(`/store/${store._id}`)} style={{cursor:'pointer'}}>
                  <span className="fs-name">{store.name}</span>
                  <span className="fs-district">{store.districtName}</span>
                  <span className="fs-rating">⭐ {store.stats.rating.toFixed(1)}</span>
                  <span className="fs-revenue">💰 {store.stats.totalRevenue.toFixed(0)}€</span>
                  <button className="btn btn-sm btn-outline">Gestionar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Network Visual */}
        {state.stores.length >= 2 && (
          <div className="card">
            <h3>🌐 Tu Red de Tiendas</h3>
            <div className="franchise-network">
              {state.stores.map((store, i) => (
                <React.Fragment key={store._id}>
                  <div className="network-node" onClick={() => navigate(`/store/${store._id}`)}>
                    <div className="network-node-icon">
                      {store.isOpen ? '🟢' : '🔴'}
                    </div>
                    <span className="network-node-name">{store.name}</span>
                    <span className="network-node-detail">{store.districtName}</span>
                    <span className="network-node-rev">{store.stats.totalRevenue.toFixed(0)}€</span>
                  </div>
                  {i < state.stores.length - 1 && <div className="network-connector">
                    <div className="network-line"/>
                    <span className="network-arrow">→</span>
                  </div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        </>}

        {/* ════════════════════════════════════════ */}
        {/* LICENSES TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'licenses' && <>
          <div className="grid grid-3">
            {licenseTypes.map(lic => (
              <div key={lic.id} className="license-card card">
                <div className="license-icon">{lic.icon}</div>
                <h3 className="license-name">{lic.name}</h3>
                <div className="license-price">💰 {lic.price}€</div>
                <div className="license-duration">📅 {lic.duration}</div>
                <p className="license-desc">{lic.benefit}</p>
                <button
                  className={`btn ${(state.user?.money||0) >= lic.price ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleBuyLicense(lic.id)}
                  disabled={(state.user?.money||0) < lic.price}
                  style={{width:'100%'}}
                >
                  {(state.user?.money||0) >= lic.price ? 'Comprar licencia' : `Faltan ${(lic.price - (state.user?.money||0)).toFixed(0)}€`}
                </button>
              </div>
            ))}
          </div>

          <div className="card" style={{marginTop:20}}>
            <h3>📋 Tus licencias activas</h3>
            <p className="text-secondary" style={{fontSize:13}}>Aquí verás las licencias que has comprado para usar marcas de otros jugadores.</p>
            <div style={{textAlign:'center',padding:30,color:'var(--color-text-light)'}}>
              🛒 Próximamente: mercado de licencias entre jugadores
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}
