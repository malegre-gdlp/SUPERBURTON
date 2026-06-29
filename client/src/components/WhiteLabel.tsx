import React, { useState, useEffect } from 'react'
import { useGame } from '../engine/GameContext'
import { catalogApi, economyApi } from '../api'
import type { Product, PriceRange } from '../types'
import './WhiteLabel.css'

/* ── Helper: spawn confetti ── */
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

const packageShapes = [
  { id: 'box', label: '📦 Caja', icon: '📦' },
  { id: 'bottle', label: '🍾 Botella', icon: '🍾' },
  { id: 'bag', label: '🛍️ Bolsa', icon: '🛍️' },
  { id: 'can', label: '🥫 Lata', icon: '🥫' },
  { id: 'jar', label: '🫙 Tarro', icon: '🫙' },
  { id: 'pouch', label: '🧃 Bolsita', icon: '🧃' },
]

export default function WhiteLabel() {
  const { state, notify } = useGame()
  const storeLevel = state.stores?.length > 0
    ? Math.max(...state.stores.map((s:any) => s.level || 1))
    : state.user?.level || 1
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'alimentacion',
    brandName: '',
    quality: 50,
    rarity: 10,
    manufacturingCost: 1.0,
    demandFactor: 1.0,
    primaryColor: '#4CAF50',
    secondaryColor: '#FF9800',
    packageShape: 'box',
    logoStyle: 'modern'
  })
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null)
  const [proposedPrice, setProposedPrice] = useState(0)
  const [priceValidation, setPriceValidation] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMyProducts()
  }, [])

  useEffect(() => {
    // Update price range whenever form changes
    updatePricePreview()
  }, [form])

  const loadMyProducts = async () => {
    // In production, this would filter by owner
    try {
      const { data } = await catalogApi.getAll({ search: 'white-label' })
      setMyProducts(data.products.filter(p => p.isWhiteLabel))
    } catch {}
  }

  const updatePricePreview = () => {
    // Simulate price range calculation
    const cost = form.manufacturingCost
    const quality = form.quality
    const rarity = form.rarity
    const demand = form.demandFactor

    const qualityMod = 1.0 + (quality / 100) * 0.5
    const rarityMod = 1.0 + (rarity / 100) * 1.0
    const demandMod = demand

    const baseMin = cost * 1.10
    const baseMax = cost * 2.50

    const min = Math.round(baseMin * qualityMod * rarityMod * demandMod * 100) / 100
    const max = Math.round(baseMax * qualityMod * rarityMod * demandMod * 100) / 100

    setPriceRange({
      min,
      max: Math.max(min + 0.10, max),
      suggested: Math.round((min + max) / 2 * 100) / 100
    })
    setProposedPrice(Math.round((min + max) / 2 * 100) / 100)
  }

  const validatePrice = () => {
    if (!priceRange) return null
    if (proposedPrice < priceRange.min) {
      return { valid: false, error: `El precio mínimo permitido es ${priceRange.min.toFixed(2)} €` }
    }
    if (proposedPrice > priceRange.max) {
      return { valid: false, error: `El precio máximo permitido es ${priceRange.max.toFixed(2)} €` }
    }
    return { valid: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (storeLevel < 5) {
      notify('warning', 'Necesitas nivel 10 para crear marca blanca')
      return
    }

    const validation = validatePrice()
    if (!validation?.valid) {
      notify('error', validation?.error || 'Precio no válido')
      return
    }

    setSubmitting(true)
    try {
      await catalogApi.submitWhiteLabel({
        name: form.name,
        description: form.description,
        category: form.category,
        brandName: form.brandName,
        imageUrl: `${form.primaryColor}|${form.secondaryColor}|${form.packageShape}`
      })
      notify('success', `🎉 ¡${form.brandName} — ${form.name} enviado para revisión!`)
      popConfetti(10)
      setShowCreate(false)
      setForm({
        name: '', description: '', category: 'alimentacion',
        brandName: '', quality: 50, rarity: 10,
        manufacturingCost: 1.0, demandFactor: 1.0,
        primaryColor: '#4CAF50', secondaryColor: '#FF9800',
        packageShape: 'box', logoStyle: 'modern'
      })
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Error al crear producto')
    }
    setSubmitting(false)
  }

  const categories = [
    { id: 'alimentacion', name: 'Alimentación', icon: '🍎' },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
    { id: 'limpieza', name: 'Limpieza', icon: '🧹' },
    { id: 'mascotas', name: 'Mascotas', icon: '🐾' },
    { id: 'electronica', name: 'Electrónica', icon: '💻' },
    { id: 'jardineria', name: 'Jardinería', icon: '🌿' },
    { id: 'farmacia', name: 'Farmacia', icon: '💊' },
    { id: 'moda', name: 'Moda', icon: '👕' },
    { id: 'juguetes', name: 'Juguetes', icon: '🎮' }
  ]

  return (
    <div className="page white-label-page">
      <div className="container">
        <div className="wl-header">
          <div>
            <h1>🏷️ Marca Blanca</h1>
            <p className="text-secondary">Crea tus propios productos y gana royalties</p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setShowCreate(true)}
            disabled={storeLevel < 5}
          >
            + Nuevo Producto
          </button>
        </div>

        {storeLevel < 5 && (
          <div className="level-lock card">
            <span className="lock-icon">🔒</span>
            <div>
              <h3>Desbloquea la Marca Blanca</h3>
              <p>Alcanza el nivel 5 de tienda para crear tus propios productos. Actual: Nivel {storeLevel}</p>
              <div className="level-progress">
                <div
                  className="level-fill"
                  style={{
                    width: `${Math.min(100, (storeLevel / 5) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {myProducts.length > 0 && (
          <div className="grid grid-3">
            {myProducts.map(p => (
              <div key={p._id} className="wl-product-card card">
                <div className="wl-product-header">
                  <span className="wl-brand-name">{p.whiteLabelDesign?.brandName || p.name}</span>
                  <span className={`badge ${p.whiteLabelDesign?.approved ? 'badge-success' : 'badge-warning'}`}>
                    {p.whiteLabelDesign?.approved ? 'Aprobado' : 'Pendiente'}
                  </span>
                </div>
                <p className="wl-product-name">{p.name}</p>
                <div className="wl-product-stats">
                  {p.whiteLabelDesign?.approved && (
                    <>
                      <span>Royalties: {p.whiteLabelDesign.royaltyPercentage}%</span>
                      <span>Ganado: {p.whiteLabelDesign.totalRoyaltiesEarned.toFixed(2)}€</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal card modal-wide" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏷️ Crear Producto de Marca Blanca</h2>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="wl-form-grid">
                  <div className="wl-form-section">
                    <h4>Información del producto</h4>
                    <div className="form-group">
                      <label>Nombre del producto</label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Ej: Arroz Fino Premium"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nombre de la marca</label>
                      <input
                        value={form.brandName}
                        onChange={e => setForm({ ...form, brandName: e.target.value })}
                        placeholder="Ej: DeliSuper"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe tu producto..."
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="wl-form-section">
                    <h4>🎨 Diseño del empaque</h4>
                    {/* Live preview */}
                    <div className="wl-preview" style={{background:form.primaryColor, borderColor:form.secondaryColor}}>
                      <div className="wl-preview-shape">
                        {packageShapes.find(s => s.id === form.packageShape)?.icon || '📦'}
                      </div>
                      <div className="wl-preview-info">
                        <span className="wl-preview-brand" style={{color:'#fff'}}>{form.brandName || 'MARCA'}</span>
                        <span className="wl-preview-name" style={{color:'rgba(255,255,255,.8)'}}>{form.name || 'Producto'}</span>
                      </div>
                      <div className="wl-preview-accent" style={{background:form.secondaryColor}}/>
                    </div>
                    <div className="form-group">
                      <label>Color principal</label>
                      <div className="wl-color-row">
                        <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                          style={{width:50,height:40,padding:2,borderRadius:8,cursor:'pointer'}}/>
                        <span className="wl-color-hex">{form.primaryColor}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Color secundario</label>
                      <div className="wl-color-row">
                        <input type="color" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})}
                          style={{width:50,height:40,padding:2,borderRadius:8,cursor:'pointer'}}/>
                        <span className="wl-color-hex">{form.secondaryColor}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tipo de empaque</label>
                      <div className="wl-shape-grid">
                        {packageShapes.map(ps => (
                          <button key={ps.id} type="button"
                            className={`wl-shape-btn ${form.packageShape === ps.id ? 'active' : ''}`}
                            onClick={() => setForm({...form, packageShape: ps.id})}
                          >
                            {ps.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="wl-form-section">
                    <h4>📊 Atributos del producto</h4>
                    <div className="form-group">
                      <label>Calidad (1-100): {form.quality}</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={form.quality}
                        onChange={e => setForm({ ...form, quality: parseInt(e.target.value) })}
                      />
                      <div className="range-labels">
                        <span>Básico</span>
                        <span>Premium</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Rareza (1-100): {form.rarity}</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={form.rarity}
                        onChange={e => setForm({ ...form, rarity: parseInt(e.target.value) })}
                      />
                      <div className="range-labels">
                        <span>Común</span>
                        <span>Único</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Coste de fabricación (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.manufacturingCost}
                        onChange={e => setForm({ ...form, manufacturingCost: parseFloat(e.target.value) || 0.01 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Factor de demanda: {form.demandFactor.toFixed(1)}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={form.demandFactor}
                        onChange={e => setForm({ ...form, demandFactor: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Price Preview */}
                {priceRange && (
                  <div className="price-preview card">
                    <h4>💰 Rango de precio mayorista calculado</h4>
                    <div className="price-preview-bars">
                      <div className="pp-bar-container">
                        <div className="pp-bar">
                          <div className="pp-fill" style={{
                            left: `${(priceRange.min / priceRange.max) * 50}%`,
                            width: `${((priceRange.max - priceRange.min) / priceRange.max) * 50}%`
                          }} />
                        </div>
                      </div>
                      <div className="pp-labels">
                        <span>{priceRange.min.toFixed(2)}€</span>
                        <span className="pp-suggested">Sugerido: {priceRange.suggested.toFixed(2)}€</span>
                        <span>{priceRange.max.toFixed(2)}€</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tu precio mayorista</label>
                      <div className="price-input-group">
                        <input
                          type="number"
                          step="0.01"
                          min={priceRange.min}
                          max={priceRange.max}
                          value={proposedPrice}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            setProposedPrice(val)
                            setPriceValidation(validatePrice())
                          }}
                        />
                        <span>€</span>
                      </div>
                      {proposedPrice > priceRange.max && (
                        <span className="price-error">⚠️ El precio máximo permitido es {priceRange.max.toFixed(2)}€</span>
                      )}
                      {proposedPrice < priceRange.min && (
                        <span className="price-error">⚠️ El precio mínimo permitido es {priceRange.min.toFixed(2)}€</span>
                      )}
                    </div>
                    {priceValidation?.valid && (
                      <div className="price-valid">✅ Precio dentro del rango permitido</div>
                    )}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar para revisión'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
