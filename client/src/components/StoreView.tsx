import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, catalogApi, economyApi, authApi, gameApi } from '../api'
import type { Store, Product } from '../types'
import './StoreView.css'

/* ── Helper: spawn floating text ── */
function spawnFloat(text: string, cls = 'floating-text coins') {
  const el = document.createElement('div')
  el.className = cls
  el.textContent = text
  el.style.left = (30 + Math.random() * 40) + '%'
  el.style.top = (25 + Math.random() * 25) + '%'
  el.style.fontSize = (18 + Math.random() * 14) + 'px'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1800)
}

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

const C: Record<string,string> = { alimentacion:'#4CAF50',bebidas:'#2196F3',limpieza:'#FF9800',mascotas:'#9C27B0',electronica:'#00BCD4',jardineria:'#8BC34A',farmacia:'#F44336',moda:'#E91E63',juguetes:'#FF5722' }
const I: Record<string,string> = { alimentacion:'🍎',bebidas:'🥤',limpieza:'🧹',mascotas:'🐾',electronica:'💻',jardineria:'🌿',farmacia:'💊',moda:'👕',juguetes:'🎮' }
const D: Record<string,string> = { barrio:'🏘️',ciudad:'🏙️',centro_comercial:'🏬',zona_exclusiva:'🌴' }

export default function StoreView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch, notify } = useGame()
  const [s, setS] = useState<Store|null>(null)
  const [cat, setCat] = useState<Product[]>([])
  const [tab, setTab] = useState('overview')
  const [tr, setTr] = useState<any>(null)
  const [day, setDay] = useState(1)
  const [cust, setCust] = useState<any[]>([])
  const [showBuy, setShowBuy] = useState(false)
  const [buyQty, setBuyQty] = useState(10)
  const [animTick, setAnimTick] = useState(false)
  const tickRef = useRef(false)

  useEffect(() => { loadStore(); loadCat(); loadDay() }, [id])

  /* Auto-tick every 30s when store is open */
  useEffect(() => {
    if (!s?.isOpen) return
    const iv = setInterval(async () => {
      if (tickRef.current || !s?.isOpen) return
      tickRef.current = true
      try {
        const { data } = await economyApi.tickStore(s._id)
        if (data?.result) {
          setTr(data.result)
          setAnimTick(true); setTimeout(() => setAnimTick(false), 1000)
          if (data.result.totalProfit > 0) spawnFloat(`+${data.result.totalProfit.toFixed(0)}€ 📈`)
          if (data.result.customers > 5) popConfetti(3)
          setCust(Array.from({length:Math.min(data.result.customers||0,15)}, (_,i) => ({id:i,x:Math.random()*80+10,y:Math.random()*70+15})))
          setTimeout(() => setCust([]), 4000)
        }
        loadStore(); loadUser(); loadDay()
      } catch { /* silent auto-tick */ }
      finally { tickRef.current = false }
    }, 30000)
    return () => clearInterval(iv)
  }, [s?.isOpen, s?._id])

  const loadStore = async () => {
    try { const { data } = await storeApi.getById(id!); setS(data.store) } catch { nav('/dashboard') }
  }
  const loadCat = async () => {
    try { const { data } = await catalogApi.getAll({}); setCat(data.products) } catch {}
  }
  const loadDay = async () => {
    try { const { data } = await gameApi.getState(); setDay(data.day) } catch {}
  }
  const loadUser = async () => {
    try { const { data } = await authApi.getProfile(); dispatch({ type:'SET_USER', payload:data.user }) } catch {}
  }
  const gp = (pid:string) => cat.find(p => p._id === pid)

  const doTick = async () => {
    if (!s) return
    try {
      const { data } = await economyApi.tickStore(s._id)
      if (data?.result) {
        setTr(data.result)
        setAnimTick(true); setTimeout(() => setAnimTick(false), 1000)
        if (data.result.totalProfit > 0) spawnFloat(`+${data.result.totalProfit.toFixed(0)}€ 📈`)
        if (data.result.customers > 3) popConfetti(4)
        notify('success',`🛒 ${data.result.customers} clientes | 💰 +${data.result.totalRevenue.toFixed(2)}€ | 📈 +${data.result.totalProfit.toFixed(2)}€ ganancia`)
        setCust(Array.from({length:Math.min(data.result.customers||0,15)}, (_,i) => ({id:i,x:Math.random()*80+10,y:Math.random()*70+15})))
        setTimeout(() => setCust([]), 4000)
      }
      loadStore(); loadUser(); loadDay()
    } catch (e:any) { notify('error', e?.response?.data?.error || 'Error') }
  }

  const doRestock = async () => {
    if (!s) return
    try { const { data } = await storeApi.restock(s._id); notify('success',`📦 ${data.restocked} repuestos`); loadStore() }
    catch { notify('error','Error restock') }
  }

  const toggle = async () => {
    if (!s) return
    try { const { data } = await storeApi.toggleOpen(s._id); setS(data.store); loadDay() }
    catch { notify('error','Error') }
  }

  const updatePrice = async (si:number, pi:number, price:number) => {
    if (!s) return
    const copy = JSON.parse(JSON.stringify(s))
    copy.shelves[si].products[pi].price = price
    try { const { data } = await storeApi.update(s._id, { shelves: copy.shelves } as any); setS(data.store); notify('info','Precio OK') }
    catch { notify('error','Error precio') }
  }

  const hire = async (role:string) => {
    if (!s) return
    try { await storeApi.hireEmployee(s._id, { name:role+'_'+(s.employees.length+1), role, salary: {cashier:800,stockist:900,manager:1200,cleaner:700,security:1000}[role]||800 }); loadStore(); notify('success',`${role} contratado`) }
    catch { notify('error','Error') }
  }

  const fire = async (i:number) => {
    if (!s) return
    try { await storeApi.fireEmployee(s._id, i); loadStore() }
    catch { notify('error','Error') }
  }

  const buy = async (pid:string, price:number, pname:string) => {
    if (!s) return
    const q = buyQty
    const cost = price * q
    if (money < cost) { notify('error', `💰 Necesitas ${cost.toFixed(2)}€, tienes ${money.toFixed(2)}€`); return }
    try {
      await storeApi.addToWarehouse(s._id, { productId:pid, quantity:q, purchasePrice:price })
      notify('success', `✅ ${q} x ${pname} — ${price.toFixed(2)}€/ud`)
      loadStore(); loadUser()
    } catch (e:any) { notify('error', e?.response?.data?.error || 'Error al comprar') }
  }

  const addShelf = async () => {
    if (!s) return
    try { await storeApi.addShelf(s._id, { position:{x:s.shelves.length*2,y:0}, type:'standard', category:'alimentacion' }); loadStore() }
    catch { notify('error','Error') }
  }

  const remShelf = async (i:number) => {
    if (!s) return
    try { await storeApi.removeShelf(s._id, i); loadStore() }
    catch { notify('error','Error') }
  }

  /* ── Drag & Drop Warehouse → Shelf ── */
  const [dragItem, setDragItem] = useState<{idx:number} | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    setDragItem({ idx })
  }

  const handleShelfDragOver = (e: React.DragEvent, si: number) => {
    e.preventDefault()
    setDropTarget(si)
  }

  const handleShelfDrop = async (si: number) => {
    setDropTarget(null)
    if (dragItem === null || !s) return
    const wi = dragItem.idx
    const wItem = s.warehouse[wi]
    if (!wItem) { setDragItem(null); return }
    try {
      const { data } = await storeApi.moveToShelf(s._id, {
        warehouseItemIndex: wi,
        shelfIndex: si,
        quantity: Math.min(wItem.quantity, 25)
      })
      notify('success', `📦 Movido a estantería`)
      spawnFloat(`+${Math.min(wItem.quantity, 25)} uds`, 'floating-text xp')
      loadStore()
    } catch (e: any) {
      notify('error', e?.response?.data?.error || 'Error al mover')
    }
    setDragItem(null)
  }

  /* ── Shelf → Shelf drag reorder (local only) ── */
  const handleShelfDragStart = (i: number) => {
    setDragItem({ idx: i })
  }

  if (!s) return <div className="page"><div className="container" style={{textAlign:'center',padding:60}}>🔄 Cargando...</div></div>

  const totStock = s.shelves.reduce((t,x) => t + x.products.reduce((p,y) => p + y.quantity, 0), 0)
  const money = state?.user?.money || 0

  return (
    <div className="page store-view">
      {cust.length > 0 && <div className="customer-overlay">
        {cust.map(c => <div key={c.id} className="customer-dot" style={{left:c.x+'%',top:c.y+'%'}}>🛒</div>)}
      </div>}

      <div className="container">
        {/* header */}
        <div className={`store-header ${animTick ? 'cash-register' : ''}`}>
          <div>
            <button className="btn btn-ghost" onClick={() => nav('/dashboard')}>←</button>
            <div className="header-title-row"><h1>{s.name}</h1>
              <button className={`btn btn-sm ${s.isOpen?'btn-danger':'btn-success'}`} onClick={toggle}>{s.isOpen?'🔴 Cerrar':'🟢 Abrir'}</button>
            </div>
            <div className="store-meta">
              <span>{D[s.districtType]||'📍'} {s.districtName}</span>
              <span>⭐ {s.stats.rating.toFixed(1)}</span>
              <span>📅 Día {day}</span>
              <span>⭐ Nv.{s.level||1}</span>
              <span>💰 {money.toFixed(2)}€</span>
              <span>📦 {totStock}</span>
            </div>
          </div>
          <div className="store-header-actions">
            <button className="btn btn-sm btn-secondary" onClick={doRestock}>📦 Restock</button>
            <button className="btn btn-sm btn-secondary" onClick={doTick}>⏭️ Tick</button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowBuy(true)}>🛍️ Comprar</button>
          </div>
        </div>

        {/* tabs */}
        <div className="store-tabs">
          {[
            { key: 'overview', icon: '📊', label: 'Resumen' },
            { key: 'layout', icon: '🏗️', label: 'Tienda' },
            { key: 'products', icon: '📦', label: 'Productos' },
            { key: 'warehouse', icon: '📦', label: 'Almacén' },
            { key: 'employees', icon: '👥', label: 'Empleados' },
          ].map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && <div className="grid grid-2">
          <div className="card"><h3>📊 Stats</h3>
            <div className="stats-grid">
              <div className="stat-box"><span className="stat-big">{s.stats.totalCustomers}</span><span>Clientes</span></div>
              <div className="stat-box"><span className="stat-big">{s.stats.totalSales}</span><span>Ventas</span></div>
              <div className="stat-box"><span className="stat-big">{s.stats.totalRevenue.toFixed(0)}€</span><span>Ingresos</span></div>
              <div className="stat-box"><span className="stat-big">{s.stats.rating.toFixed(1)}⭐</span><span>Rating</span></div>
              <div className="stat-box"><span className="stat-big">{money.toFixed(0)}€</span><span>Tu dinero</span></div>
              <div className="stat-box"><span className="stat-big">{s.employees.length}</span><span>Empleados</span></div>
              <div className="stat-box"><span className="stat-big">Nv.{s.level||1}</span><span>Nivel</span></div>
            </div>
            {/* XP bar */}
            <div style={{marginTop:10,background:'var(--color-bg)',borderRadius:8,padding:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                <span>⭐ Nivel {s.level||1}</span>
                <span>{s.experience||0} XP</span>
              </div>
              <div style={{background:'var(--color-border)',borderRadius:4,height:6,overflow:'hidden'}}>
                <div className={s.experience > 0 && (s.experience % 500) > 450 ? 'xp-bar-glow' : ''} style={{background:'linear-gradient(90deg,#4CAF50,#8BC34A)',height:'100%',borderRadius:4,width:Math.min(100,((s.experience||0)%500)/500*100)+'%',transition:'width .5s'}}/>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>📅 Día {day}</h3>
            <p>🏗️ {s.shelves.length} estanterías | 👥 {s.employees.length} empleados</p>
            <p>📦 {totStock} productos | 🏭 {s.warehouse?.length||0} en almacén</p>
            {tr && <div className="tick-card">
              <div className="tick-row"><span>👥 Clientes</span><span>{tr.customers}</span></div>
              <div className="tick-row"><span>🛒 Ventas</span><span>{tr.totalSales}</span></div>
              <div className="tick-row"><span>💰 Ingresos</span><span>{tr.totalRevenue.toFixed(2)}€</span></div>
              <div className="tick-row" style={{fontWeight:700,color:'var(--color-primary)'}}><span>📈 Ganancia</span><span>+{tr.totalProfit.toFixed(2)}€</span></div>
            </div>}

            {/* Satisfaction meters */}
            <div style={{marginTop:12}}>
              <div className="satisfaction-row">
                <span className="sat-label">😊 Satisfacción</span>
                <div className="sat-bar">
                  <div className="sat-fill" style={{
                    width: s.stats.customerSatisfaction + '%',
                    background: s.stats.customerSatisfaction > 60 ? 'var(--color-success)' : s.stats.customerSatisfaction > 30 ? 'var(--color-warning)' : 'var(--color-danger)'
                  }}/>
                </div>
                <span className="sat-value">{s.stats.customerSatisfaction.toFixed(0)}%</span>
              </div>
              <div className="satisfaction-row">
                <span className="sat-label">🏷️ Precio justo</span>
                <div className="sat-bar">
                  <div className="sat-fill" style={{
                    width: s.stats.priceFairnessReputation + '%',
                    background: s.stats.priceFairnessReputation > 60 ? 'var(--color-success)' : s.stats.priceFairnessReputation > 30 ? 'var(--color-warning)' : 'var(--color-danger)'
                  }}/>
                </div>
                <span className="sat-value">{s.stats.priceFairnessReputation.toFixed(0)}%</span>
              </div>
              <div className="satisfaction-row">
                <span className="sat-label">❤️ Lealtad</span>
                <div className="sat-bar">
                  <div className="sat-fill" style={{
                    width: Math.max(0, s.customerLoyalty + 50) + '%',
                    background: s.customerLoyalty > 20 ? 'var(--color-success)' : s.customerLoyalty > -10 ? 'var(--color-warning)' : 'var(--color-danger)'
                  }}/>
                </div>
                <span className="sat-value">{s.customerLoyalty?.toFixed(0) || 0}</span>
              </div>
            </div>

            {/* Activity feed from tick */}
            {tr?.rejectedPurchases?.length > 0 && (
              <div className="activity-feed">
                <h4>⚠️ Rechazos</h4>
                {tr.rejectedPurchases.slice(0, 3).map((rp: any, i: number) => (
                  <div key={i} className="activity-item">
                    <span>❌ {rp.productName}</span>
                    <span className="activity-time">{rp.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>}

        {/* ═══ LAYOUT ═══ */}
        {tab === 'layout' && <div className="card">
          <div className="layout-header"><h3>🏗️ Tienda</h3>
            <button className="btn btn-sm btn-primary" onClick={addShelf}>+ Estantería</button>
          </div>
          <div className="store-grid">
            {s.shelves.map((sh,i) => (
              <div key={i} className="shelf-block" style={{borderColor:C[sh.category]||'#ccc'}} draggable onDragStart={()=>handleShelfDragStart(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>{}}>
                <div className="shelf-block-header" style={{background:C[sh.category]||'#ccc'}}>{I[sh.category]} {sh.category?.slice(0,4)}</div>
                <div className="shelf-block-body">
                  <span className="shelf-block-count">{sh.products.reduce((t,p)=>t+p.quantity,0)}</span>
                  <span className="shelf-block-label">{sh.type}</span>
                </div>
                <button className="shelf-del" onClick={() => remShelf(i)}>✕</button>
              </div>
            ))}
            <div className="shelf-block shelf-add" onClick={addShelf}>
              <span className="shelf-add-icon">+</span>
              <span>Añadir</span>
            </div>
          </div>
        </div>}

        {/* ═══ PRODUCTS ═══ */}
        {tab === 'products' && <div>
          {s.shelves.map((sh, si) => sh.products.length > 0 && (
            <div key={si} className="card" style={{marginBottom:10, borderLeft:`4px solid ${C[sh.category]||'#ccc'}`}}>
              <h4 style={{color:C[sh.category],margin:'0 0 8px',fontSize:14}}>{I[sh.category]} <b>{sh.category}</b> <span style={{fontWeight:400,fontSize:11,color:'var(--color-text-secondary)'}}>{sh.type}</span></h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
                {sh.products.map((sp, pi) => {
                  const p = gp(sp.productId)
                  const fill = sp.maxCapacity > 0 ? Math.round(sp.quantity/sp.maxCapacity*100) : 0
                  return <div key={pi} className="prod-card" style={{border:`1px solid ${C[sh.category]||'#eee'}22`,borderRadius:8,padding:'8px 10px',background:'var(--color-bg)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,flex:1}}>{p?.name||'?'}</span>
                      <span style={{fontSize:10,color:fill>50?'#4CAF50':fill>20?'#FF9800':'#F44336',fontWeight:700,whiteSpace:'nowrap'}}>
                        {fill>50?'●':fill>20?'⚠️':'🔴'} {sp.quantity}/{sp.maxCapacity}
                      </span>
                    </div>
                    {/* Stock bar */}
                    <div style={{background:'var(--color-border)',borderRadius:3,height:5,marginBottom:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:C[sh.category]||'#4CAF50',borderRadius:3,width:fill+'%',transition:'width .4s'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type="number" step="0.01" defaultValue={sp.price} style={{width:60,padding:'2px 4px',fontSize:12,border:'1px solid var(--color-border)',borderRadius:4,textAlign:'right'}}
                          onBlur={e => { const v = parseFloat(e.target.value); if (v && v !== sp.price) updatePrice(si, pi, v) }}
                          onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat((e.target as HTMLInputElement).value); if (v) updatePrice(si, pi, v); (e.target as HTMLInputElement).blur() } }}/>
                        <span style={{fontSize:10,color:'var(--color-text-secondary)'}}>€</span>
                      </div>
                    </div>
                  </div>
                })}
              </div>
            </div>
          ))}
          {s.shelves.every(sh => sh.products.length === 0) && <div className="card"><p style={{textAlign:'center',color:'var(--color-text-secondary)',padding:20}}>📭 Sin productos. Haz click en 🛍️ Comprar.</p></div>}
        </div>}

        {/* ═══ WAREHOUSE ═══ */}
        {tab === 'warehouse' && <div className="grid grid-2">
          {/* Warehouse inventory */}
          <div className="card">
            <div className="layout-header">
              <h3>🏭 Almacén</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowBuy(true)}>🛍️ Comprar</button>
            </div>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:10}}>
              Arrastra productos al estante donde quieras colocarlos
            </p>
            {s.warehouse.length === 0 ? (
              <div style={{textAlign:'center',padding:30,color:'var(--color-text-secondary)'}}>
                <div style={{fontSize:48,marginBottom:12}}>📦</div>
                <p>Almacén vacío. Compra productos del mercado mayorista.</p>
              </div>
            ) : (
              <div className="warehouse-grid">
                {s.warehouse.map((w, wi) => {
                  const p = gp(w.productId)
                  return (
                    <div
                      key={wi}
                      className={`warehouse-item ${dragItem?.idx === wi ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(wi)}
                      style={{ borderLeft: `4px solid ${C[p?.category||'']||'#888'}` }}
                    >
                      <div className="warehouse-item-header">
                        <span className="warehouse-item-icon">{I[p?.category||'']||'📦'}</span>
                        <span className="warehouse-item-name">{p?.name || '?'}</span>
                      </div>
                      <div className="warehouse-item-details">
                        <div className="warehouse-item-qty">
                          <span className="wh-qty-num">{w.quantity}</span>
                          <span className="wh-qty-label">uds</span>
                        </div>
                        <div className="warehouse-item-price">
                          <span>{(w.purchasePrice||0).toFixed(2)}€</span>
                        </div>
                        <div className="warehouse-item-min">
                          <span style={{fontSize:10,color:'var(--color-text-light)'}}>Min: {w.minStock||10}</span>
                        </div>
                      </div>
                      <div className="warehouse-item-drag-hint">⋮⋮ Arrastrar</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Shelf targets */}
          <div className="card">
            <div className="layout-header">
              <h3>🏪 Estanterías</h3>
              <button className="btn btn-sm btn-secondary" onClick={doRestock}>📦 Restock auto</button>
            </div>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:10}}>
              Suelta productos aquí para reabastecer
            </p>
            <div className="warehouse-shelf-list">
              {s.shelves.map((sh, si) => (
                <div
                  key={si}
                  className={`warehouse-shelf-target ${dropTarget === si ? 'drop-active' : ''}`}
                  onDragOver={(e) => handleShelfDragOver(e, si)}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={() => handleShelfDrop(si)}
                  style={{ borderColor: C[sh.category]||'#ccc' }}
                >
                  <div className="wst-header" style={{background:C[sh.category]||'#ccc'}}>
                    {I[sh.category]} {sh.category}
                    <span className="wst-type">{sh.type}</span>
                  </div>
                  <div className="wst-body">
                    <span className="wst-count">
                      {sh.products.reduce((t,p)=>t+p.quantity,0)} / {sh.products.reduce((t,p)=>t+p.maxCapacity,0) || 50}
                    </span>
                    <div className="wst-bar">
                      <div className="wst-bar-fill" style={{
                        width: Math.min(100, sh.products.reduce((t,p)=>t+p.quantity,0) / Math.max(1, sh.products.reduce((t,p)=>t+p.maxCapacity,0)) * 100) + '%',
                        background: C[sh.category]||'#4CAF50'
                      }}/>
                    </div>
                  </div>
                  <div className="wst-products">
                    {sh.products.slice(0, 3).map((sp, pi) => {
                      const p = gp(sp.productId)
                      return <span key={pi} className="wst-product-tag">{p?.name?.slice(0,12)||'?'} ×{sp.quantity}</span>
                    })}
                    {sh.products.length > 3 && <span className="wst-more">+{sh.products.length-3} más</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ═══ EMPLOYEES ═══ */}
        {tab === 'employees' && <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="layout-header">
              <h3>👥 Empleados</h3>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {[
                  { role: 'cashier', label: '🧾 Cajero', salary: 800 },
                  { role: 'stockist', label: '📦 Reponedor', salary: 900 },
                  { role: 'manager', label: '👔 Gerente', salary: 1200 },
                  { role: 'cleaner', label: '🧹 Limpiador', salary: 700 },
                  { role: 'security', label: '🛡️ Seguridad', salary: 1000 },
                ].map(r => (
                  <button key={r.role} className="btn btn-sm btn-primary" onClick={() => hire(r.role)}>
                    + {r.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:8}}>
              Cada empleado tiene un rol específico. La eficiencia y felicidad afectan el rendimiento.
            </p>
          </div>
          {s.employees.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:48,marginBottom:12}}>👥</div>
              <h3>Contrata tu primer empleado</h3>
              <p style={{color:'var(--color-text-secondary)',marginBottom:16}}>
                Los empleados mejoran la eficiencia de tu tienda
              </p>
              <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                {['cashier','stockist','manager'].map(r => (
                  <button key={r} className="btn btn-primary" onClick={() => hire(r)}>
                    Contratar {r}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="employee-grid">
              {s.employees.map((e, i) => {
                const roleMeta: Record<string,{icon:string,desc:string}> = {
                  cashier: { icon: '🧾', desc: 'Cobra a los clientes' },
                  stockist: { icon: '📦', desc: 'Repone estanterías' },
                  manager: { icon: '👔', desc: 'Gestiona la tienda' },
                  cleaner: { icon: '🧹', desc: 'Limpia la tienda' },
                  security: { icon: '🛡️', desc: 'Vigila la tienda' }
                }
                const meta = roleMeta[e.role] || { icon: '👤', desc: '' }
                const effColor = e.efficiency > 1.2 ? 'var(--color-success)' : e.efficiency > 0.8 ? 'var(--color-warning)' : 'var(--color-danger)'
                const hapColor = e.happiness > 70 ? 'var(--color-success)' : e.happiness > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
                return (
                  <div key={i} className="employee-card card">
                    <div className="emp-card-header">
                      <span className="emp-card-avatar" style={{background:`linear-gradient(135deg, hsl(${e.name.length*50},70%,60%), hsl(${e.name.length*50+60},70%,50%))`}}>
                        {meta.icon}
                      </span>
                      <div className="emp-card-info">
                        <span className="emp-card-name">{e.name}</span>
                        <span className="emp-card-role" style={{textTransform:'capitalize'}}>{e.role}</span>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => fire(i)} title="Despedir">✕</button>
                    </div>
                    <div className="emp-card-desc">{meta.desc}</div>
                    <div className="emp-card-stats">
                      <div className="emp-stat">
                        <span className="emp-stat-label">💰 Salario</span>
                        <span className="emp-stat-val">{e.salary}€</span>
                      </div>
                      <div className="emp-stat">
                        <span className="emp-stat-label">⚡ Eficiencia</span>
                        <span className="emp-stat-val" style={{color:effColor}}>{e.efficiency.toFixed(1)}x</span>
                      </div>
                      <div className="emp-stat">
                        <span className="emp-stat-label">😊 Felicidad</span>
                        <span className="emp-stat-val" style={{color:hapColor}}>{e.happiness}%</span>
                      </div>
                    </div>
                    {/* Mini bars */}
                    <div className="emp-mini-bars">
                      <div className="emp-mini-row">
                        <span className="emp-mini-label">Eficiencia</span>
                        <div className="emp-mini-track">
                          <div className="emp-mini-fill" style={{width:Math.min(100,(e.efficiency/2)*100)+'%',background:effColor}}/>
                        </div>
                      </div>
                      <div className="emp-mini-row">
                        <span className="emp-mini-label">Felicidad</span>
                        <div className="emp-mini-track">
                          <div className="emp-mini-fill" style={{width:e.happiness+'%',background:hapColor}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>}

      {/* ═══ BUY MODAL ═══ */}
      {showBuy && <div className="modal-overlay" onClick={() => setShowBuy(false)}>
        <div className="modal card modal-wide" onClick={e => e.stopPropagation()} style={{maxWidth:700}}>
          <div className="modal-header"><h3 style={{margin:0}}>🛍️ Mercado Mayorista</h3>
            <button className="btn btn-ghost" onClick={() => setShowBuy(false)}>✕</button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0 12px',fontSize:13}}>
            <span>💰 <b>{money.toFixed(2)}€</b></span>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              Cantidad: <input type="number" min={1} max={999} value={buyQty} onChange={e => setBuyQty(parseInt(e.target.value)||1)}
                style={{width:55,padding:'3px 6px',border:'1px solid var(--color-border)',borderRadius:4,fontSize:13,textAlign:'center'}}/>
            </span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:6,maxHeight:400,overflowY:'auto'}}>
            {cat.filter(x => x.isActive).slice(0,60).map(p => {
              const cost = ((p.wholesalePrice||0) * buyQty).toFixed(2)
              const canBuy = money >= (p.wholesalePrice||0) * buyQty
              return <div key={p._id} onClick={() => canBuy ? buy(p._id, p.wholesalePrice||0.01, p.name) : null}
                style={{border:`1px solid ${C[p.category]||'#eee'}44`,borderRadius:8,padding:'8px 10px',cursor:canBuy?'pointer':'not-allowed',background:'var(--color-bg)',opacity:canBuy?1:.5,transition:'all .15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span style={{fontSize:16}}>{I[p.category]}</span>
                  <span style={{fontSize:12,fontWeight:600,flex:1}}>{p.name}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}>
                  <span style={{fontWeight:700,color:C[p.category]||'var(--color-primary)'}}>{(p.wholesalePrice||0).toFixed(2)}€</span>
                  <span>★ {p.quality||50}</span>
                  <span style={{fontWeight:600}}>{canBuy?'✅':'🔴'} {cost}€</span>
                </div>
              </div>
            })}
          </div>
        </div>
      </div>}
      </div>
    </div>
  )
}
