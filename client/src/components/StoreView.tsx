import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, catalogApi, economyApi } from '../api'
import type { Store, Product } from '../types'
import './StoreView.css'

const catColors: Record<string,string> = {
  alimentacion:'#4CAF50', bebidas:'#2196F3', limpieza:'#FF9800',
  mascotas:'#9C27B0', electronica:'#00BCD4', jardineria:'#8BC34A',
  farmacia:'#F44336', moda:'#E91E63', juguetes:'#FF5722'
}
const catIcons: Record<string,string> = {
  alimentacion:'🍎', bebidas:'🥤', limpieza:'🧹', mascotas:'🐾',
  electronica:'💻', jardineria:'🌿', farmacia:'💊', moda:'👕', juguetes:'🎮'
}
const roleSalaries: Record<string,number> = { cashier:800, stockist:900, manager:1200, cleaner:700, security:1000 }
const districtEmojis: Record<string,string> = { barrio:'🏘️', ciudad:'🏙️', centro_comercial:'🏬', zona_exclusiva:'🌴' }

export default function StoreView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, notify } = useGame()
  const [store, setStore] = useState<Store|null>(null)
  const [catalog, setCatalog] = useState<Product[]>([])
  const [tab, setTab] = useState<'overview'|'layout'|'products'|'employees'|'warehouse'>('overview')
  const [tickResult, setTickResult] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [day, setDay] = useState(1)
  const [errorCount, setErrorCount] = useState(0)
  const [customers, setCustomers] = useState<any[]>([])
  const [editingPrice, setEditingPrice] = useState<string|null>(null)
  const [editVal, setEditVal] = useState('')
  const [showHire, setShowHire] = useState(false)
  const [showAddShelf, setShowAddShelf] = useState(false)
  const [draggingShelf, setDraggingShelf] = useState<number|null>(null)
  const [newShelf, setNewShelf] = useState({ type:'standard', category:'alimentacion' })
  const [showBuy, setShowBuy] = useState(false)
  const [buyQty, setBuyQty] = useState(1)
  const tickRef = useRef(false)

  useEffect(() => { if (id) loadStore() }, [id])
  useEffect(() => { loadCatalog() }, [])

  /* Auto-day (25s) */
  useEffect(() => {
    if (!store?.isOpen) return
    tickRef.current = false; setErrorCount(0)
    const iv = setInterval(async () => {
      if (tickRef.current) return
      tickRef.current = true
      try {
        const { data } = await economyApi.tickStore(store._id)
        setTickResult(data.result)
        setActivity((p:any[]) => [{ ...data.result, time:Date.now() }, ...p].slice(0,30))
        setDay(d => d+1); setErrorCount(0)
        setCustomers(Array.from({length:Math.min(data.result.customers||0,20)}, (_,i) => ({id:i,x:Math.random()*80+10,y:Math.random()*70+15,s:0.3+Math.random()*0.7})))
        setTimeout(() => setCustomers([]), 5000)
        loadStore()
      } catch { setErrorCount(e => e+1) }
      finally { tickRef.current = false }
    }, 25000)
    return () => clearInterval(iv)
  }, [store?.isOpen, store?._id])

  const loadStore = async () => {
    try { const { data } = await storeApi.getById(id!); setStore(data.store) } catch { navigate('/dashboard') }
  }
  const loadCatalog = async () => {
    try { const { data } = await catalogApi.getAll({}); setCatalog(data.products) } catch {}
  }
  const getP = (pid:string) => catalog.find(p => p._id === pid)

  const doTick = async () => {
    if (!store) return
    try {
      const { data } = await economyApi.tickStore(store._id)
      setTickResult(data.result); setActivity((p:any[]) => [{ ...data.result, time:Date.now() }, ...p].slice(0,30))
      notify('success',`🛒 ${data.result.customers} clientes | 💰 ${data.result.totalRevenue.toFixed(2)}€`)
      setDay(d => d+1); loadStore()
    } catch { notify('error','Error') }
  }

  const doRestock = async () => {
    if (!store) return
    try { const { data } = await storeApi.restock(store._id); notify('success',`📦 ${data.restocked} productos repuestos`); loadStore() }
    catch { notify('error','Error restock') }
  }

  const toggleOpen = async () => {
    if (!store) return
    try { const { data } = await storeApi.toggleOpen(store._id); setStore(data.store); notify('info', data.store.isOpen ? '🟢 Tienda abierta' : '🔴 Tienda cerrada') }
    catch { notify('error','Error') }
  }

  const updatePrice = async (shelfIdx:number, prodIdx:number, price:number) => {
    if (!store) return
    const s = JSON.parse(JSON.stringify(store))
    s.shelves[shelfIdx].products[prodIdx].price = price
    try { const { data } = await storeApi.update(store._id, { shelves: s.shelves } as any); setStore(data.store) }
    catch { notify('error','Error precio') }
  }

  const startEditPrice = (key:string, current:number) => { setEditingPrice(key); setEditVal(String(current)) }
  const savePrice = (shelfIdx:number, prodIdx:number) => {
    if (editingPrice) { updatePrice(shelfIdx, prodIdx, parseFloat(editVal) || 0); setEditingPrice(null) }
  }

  const addShelf = async () => {
    if (!store) return
    try {
      const { data } = await storeApi.addShelf(store._id, { position:{x:store.shelves.length*2,y:0}, type:newShelf.type, category:newShelf.category })
      setStore({ ...store, shelves: [...store.shelves, data.shelf] }); setShowAddShelf(false); notify('success','Estantería añadida')
    } catch { notify('error','Error') }
  }

  const removeShelf = async (idx:number) => {
    if (!store) return
    try { await storeApi.removeShelf(store._id, idx); loadStore(); notify('info','Estantería eliminada') }
    catch { notify('error','Error') }
  }

  const hireEmployee = async (role:string, name:string) => {
    if (!store) return
    try {
      await storeApi.hireEmployee(store._id, { name, role, salary: roleSalaries[role] || 1000 })
      loadStore(); setShowHire(false); notify('success',`${name} contratado como ${role}`)
    } catch { notify('error','Error') }
  }

  const fireEmployee = async (idx:number) => {
    if (!store) return
    try { await storeApi.fireEmployee(store._id, idx); loadStore(); notify('info','Empleado despedido') }
    catch { notify('error','Error') }
  }

  const buyProduct = async (pid:string) => {
    if (!store) return
    const p = getP(pid); if (!p) return
    try {
      await storeApi.addToWarehouse(store._id, { productId:pid, quantity:buyQty, purchasePrice:p.wholesalePrice })
      notify('success',`${buyQty} x ${p.name} comprados`); setShowBuy(false); loadStore()
    } catch { notify('error','Error compra') }
  }

  if (!store) return <div className="page"><div className="container loading">🔄 Cargando tienda...</div></div>

  const totalStock = store.shelves.reduce((t,s) => t + s.products.reduce((p,sp) => p + sp.quantity, 0), 0)

  return (
    <div className="page store-view">
      {/* Customer overlay */}
      {customers.length > 0 && <div className="customer-overlay">
        {customers.map(c => <div key={c.id} className="customer-dot" style={{
          left:`${c.x}%`, top:`${c.y}%`,
          animationDuration:`${c.s}s`,
          '--tx':`${(Math.random()-0.5)*40}px`,
          '--ty':`${(Math.random()-0.5)*40}px`
        } as React.CSSProperties}>🛒</div>)}
      </div>}

      <div className="container">
        {/* Header */}
        <div className="store-header">
          <div>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Volver</button>
            <div className="header-title-row">
              <h1>{store.name}</h1>
              <button className={`btn btn-sm ${store.isOpen ? 'btn-danger' : 'btn-success'}`} onClick={toggleOpen}>
                {store.isOpen ? '🔴 Cerrar' : '🟢 Abrir'}
              </button>
            </div>
            <div className="store-meta">
              <span>{districtEmojis[store.districtType]} {store.districtName}</span>
              <span>⭐ {store.stats.rating.toFixed(1)}</span>
              <span>📅 Día {day}</span>
              <span>💰 {store.stats.totalRevenue.toFixed(0)}€</span>
              <span>📦 {totalStock}uds</span>
            </div>
          </div>
          <div className="store-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={doRestock}>📦 Restock</button>
            <button className="btn btn-secondary btn-sm" onClick={doTick}>⏭️ Tick</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowBuy(true)}>🛍️ Comprar</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="store-tabs">
          {(['overview','layout','products','warehouse','employees'] as const).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
          {t==='overview'&&'📊'}{t==='layout'&&'🏗️'}{t==='products'&&'📦'}{t==='warehouse'&&'📋'}{t==='employees'&&'👥'}
            {t==='overview'?'Resumen':t==='layout'?'Tienda':t==='products'?'Productos':t==='warehouse'?'Almacén':'Empleados'}
            </button>
          ))}
        </div>

        {/* ════════════════ OVERVIEW ════════════════ */}
        {tab === 'overview' && <div className="grid grid-2">
          <div className="card"><h3>📊 Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-box"><span className="stat-big">{store.stats.totalCustomers}</span><span>Clientes totales</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.totalSales}</span><span>Ventas totales</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.totalRevenue.toFixed(0)}€</span><span>Ingresos totales</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.rating.toFixed(1)}⭐</span><span>Valoración</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.customerSatisfaction?.toFixed(0)||'0'}%</span><span>Satisfacción</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.priceFairnessReputation?.toFixed(0)||'0'}%</span><span>Reputación</span></div>
              <div className="stat-box"><span className="stat-big">{store.stats.averageBasketSize?.toFixed(2)||'0'}€</span><span>Gasto medio</span></div>
              <div className="stat-box"><span className="stat-big">{store.customerLoyalty?.toFixed(0)||'0'}</span><span>Fidelidad</span></div>
            </div>
          </div>
          <div className="card">
            <h3>🏘️ {districtEmojis[store.districtType]} {store.districtName}</h3>
            <div className="district-info">
              <p>📅 <strong>Día {day}</strong></p>
              <p>🏗️ {store.shelves.length} estanterías | 👥 {store.employees.length} empleados</p>
              <p>📦 {totalStock} productos en tienda | 🏭 {store.warehouse?.length||0} en almacén</p>
            </div>
            {tickResult && <div className="tick-card">
              <div className="tick-row"><span>👥 {tickResult.customers} clientes</span><span>🛒 {tickResult.totalSales} ventas</span></div>
              <div className="tick-row"><span>💰 {tickResult.totalRevenue.toFixed(2)}€ ingresos</span><span>📈 {tickResult.totalProfit.toFixed(2)}€ beneficio</span></div>
              <div className="tick-row"><span>🧾 {tickResult.averageBasketSize?.toFixed(2)}€/cesta</span><span>⚠️ {tickResult.rejectedPurchases?.length||0} rechazos</span></div>
            </div>}
            {activity.length > 0 && <div className="activity-feed"><h4>📊 Actividad</h4>
              {activity.slice(0,8).map((a,i) => (
                <div key={i} className="activity-item">
                  <span className="activity-time">{new Date(a.time).toLocaleTimeString()}</span>
                  <span>👥{a.customers} 💰{a.totalRevenue.toFixed(0)}€ 📈{a.totalProfit.toFixed(0)}€</span>
                </div>
              ))}
            </div>}
          </div>
        </div>}

        {/* ════════════════ LAYOUT ════════════════ */}
        {tab === 'layout' && <div className="card">
          <div className="layout-header"><h3>🏗️ Plano de la tienda</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddShelf(true)}>+ Estantería</button>
          </div>
          <div className="store-grid" style={{ gridTemplateColumns: `repeat(${Math.max(5, Math.ceil(store.shelves.length/2)+2)}, 60px)` }}>
            {store.shelves.map((shelf, i) => (
              <div key={i} className="shelf-block" style={{ borderColor: catColors[shelf.category] || '#ccc' }}
                draggable onDragStart={() => setDraggingShelf(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (draggingShelf !== null && draggingShelf !== i) {
                  const s = [...store.shelves]; const [m] = s.splice(draggingShelf,1); s.splice(i,0,m); setStore({...store, shelves:s}); setDraggingShelf(null)
                }}>
                <div className="shelf-block-header" style={{ background: catColors[shelf.category] || '#ccc' }}>
                  {catIcons[shelf.category]} {shelf.category.slice(0,4)}
                </div>
                <div className="shelf-block-body">
                  <span className="shelf-block-count">{shelf.products.reduce((t,p) => t + p.quantity, 0)}</span>
                  <span className="shelf-block-label">{shelf.type}</span>
                </div>
                <button className="shelf-del" onClick={() => removeShelf(i)} title="Eliminar">✕</button>
              </div>
            ))}
            <div className="shelf-block shelf-add" onClick={() => setShowAddShelf(true)}>
              <span className="shelf-add-icon">+</span>
              <span>Añadir estantería</span>
            </div>
          </div>
          <p className="text-secondary" style={{marginTop:8,fontSize:12}}>💡 Arrastra estanterías para reordenarlas</p>
        </div>}

        {/* ════════════════ PRODUCTS ════════════════ */}
        {tab === 'products' && <div className="card"><h3>📦 Productos en tienda</h3>
          {store.shelves.map((shelf, si) => shelf.products.length > 0 && (
            <div key={si} className="shelf-section">
              <h4 style={{color:catColors[shelf.category]}}>{catIcons[shelf.category]} {shelf.category}
                <span className="text-secondary" style={{fontWeight:400,fontSize:12,marginLeft:8}}>{shelf.type}</span>
              </h4>
              <div className="product-table">
                {shelf.products.map((sp, pi) => {
                  const p = getP(sp.productId)
                  return <div key={pi} className="product-row">
                    <span className="product-name">{p?.name||'???'}</span>
                    <span className="product-qty">{sp.quantity}/{sp.maxCapacity}</span>
                    {editingPrice === `${si}-${pi}` ? (
                      <div className="inline-edit">
                        <input type="number" step="0.01" value={editVal} onChange={e => setEditVal(e.target.value)}
                          onBlur={() => savePrice(si, pi)} onKeyDown={e => e.key==='Enter'&&savePrice(si,pi)} autoFocus/>
                        <span>€</span>
                      </div>
                    ) : (
                      <span className="product-price" onClick={() => startEditPrice(`${si}-${pi}`, sp.price)}>
                        💰 {sp.price.toFixed(2)}€ <span className="edit-hint">✏️</span>
                      </span>
                    )}
                  </div>
                })}
              </div>
            </div>
          ))}
          {store.shelves.every(s => s.products.length === 0) && <p className="text-secondary">No hay productos. Pulsa "Restock" o "Comprar".</p>}
        </div>}

        {/* ════════════════ WAREHOUSE ════════════════ */}
        {tab === 'warehouse' && <div className="card"><h3>📋 Almacén</h3>
          <div className="product-table">
            {store.warehouse?.map((w, i) => {
              const p = getP(w.productId)
              return <div key={i} className="product-row">
                <span className="product-name">{p?.name||'???'}</span>
                <span className="product-qty">📦 {w.quantity}uds</span>
                <span className="product-price">💰 {w.purchasePrice.toFixed(2)}€/ud</span>
              </div>
            })}
            {(!store.warehouse||store.warehouse.length===0) && <p className="text-secondary">Almacén vacío. Compra productos.</p>}
          </div>
        </div>}

        {/* ════════════════ EMPLOYEES ════════════════ */}
        {tab === 'employees' && <div className="card">
          <div className="layout-header"><h3>👥 Empleados</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowHire(true)}>+ Contratar</button>
          </div>
          <div className="product-table">
            {store.employees.map((emp, i) => (
              <div key={i} className="employee-row">
                <div className="emp-info">
                  <span className="emp-name">{emp.name}</span>
                  <span className="emp-role">{emp.role}</span>
                </div>
                <div className="emp-stats">
                  <span>💰 {emp.salary}€/día</span>
                  <span>📊 {emp.efficiency.toFixed(1)}x</span>
                  <span>😊 {emp.happiness}%</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => fireEmployee(i)}>Despedir</button>
              </div>
            ))}
            {store.employees.length === 0 && <p className="text-secondary">Sin empleados. ¡Contrata personal!</p>}
          </div>
        </div>}
      </div>

      {/* ─── MODAL: Add shelf ─── */}
      {showAddShelf && <div className="modal-overlay" onClick={() => setShowAddShelf(false)}>
        <div className="modal card" onClick={e => e.stopPropagation()}>
          <h3>🏗️ Nueva estantería</h3>
          <div className="form-group"><label>Tipo</label>
            <select value={newShelf.type} onChange={e => setNewShelf({...newShelf, type:e.target.value})}>
              <option value="standard">Standard</option><option value="refrigerated">Refrigerada</option>
              <option value="frozen">Congelada</option><option value="display">Exposición</option>
            </select>
          </div>
          <div className="form-group"><label>Categoría</label>
            <select value={newShelf.category} onChange={e => setNewShelf({...newShelf, category:e.target.value})}>
              {Object.entries(catIcons).map(([k,v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={addShelf}>Añadir</button>
        </div>
      </div>}

      {/* ─── MODAL: Hire employee ─── */}
      {showHire && <div className="modal-overlay" onClick={() => setShowHire(false)}>
        <div className="modal card" onClick={e => e.stopPropagation()}>
          <h3>👥 Contratar empleado</h3>
          {Object.entries(roleSalaries).map(([role, salary]) => (
            <div key={role} className="hire-option" onClick={() => hireEmployee(role, `${role} ${store.employees.length+1}`)}>
              <div className="hire-info">
                <span className="hire-role">{role}</span>
                <span className="hire-salary">💰 {salary}€/día</span>
                <span className="hire-desc">
                  {role==='cashier'?'Cobra en caja':role==='stockist'?'Repone estanterías':role==='manager'?'Gestiona la tienda':role==='cleaner'?'Limpia':role==='security'?'Vigila'}
                </span>
              </div>
              <span className="hire-btn">Contratar →</span>
            </div>
          ))}
        </div>
      </div>}

      {/* ─── MODAL: Buy products ─── */}
      {showBuy && <div className="modal-overlay" onClick={() => setShowBuy(false)}>
        <div className="modal card modal-wide" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>🛍️ Mercado Mayorista</h3>
            <button className="btn btn-ghost" onClick={() => setShowBuy(false)}>✕</button>
          </div>
          <div className="form-group"><label>Cantidad por producto</label>
            <input type="number" min={1} max={999} value={buyQty} onChange={e => setBuyQty(parseInt(e.target.value)||1)}/>
          </div>
          <div className="buy-grid">
            {catalog.filter(p => p.isActive).slice(0, 30).map(p => (
              <div key={p._id} className="buy-item" onClick={() => buyProduct(p._id)}>
                <span className="buy-name">{catIcons[p.category]} {p.name}</span>
                <span className="buy-price">{p.wholesalePrice.toFixed(2)}€/ud</span>
              </div>
            ))}
          </div>
        </div>
      </div>}
    </div>
  )
}
