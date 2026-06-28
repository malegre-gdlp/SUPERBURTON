import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../engine/GameContext'
import { storeApi, catalogApi, economyApi, authApi, gameApi } from '../api'
import type { Store, Product } from '../types'
import './StoreView.css'

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
        notify('success',`🛒 ${data.result.customers} clientes | 💰 ${data.result.totalRevenue.toFixed(2)}€`)
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

  const buy = async (pid:string) => {
    if (!s) return
    const p = gp(pid); if (!p) return
    try { await storeApi.addToWarehouse(s._id, { productId:pid, quantity:10, purchasePrice:p.wholesalePrice }); notify('success',`10 x ${p.name}`); loadStore(); loadUser() }
    catch (e:any) { notify('error', e?.response?.data?.error || 'Error') }
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

  const handleDrop = (ti:number) => {
    /* no-op, shelf reordering not persisted */
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
        <div className="store-header">
          <div>
            <button className="btn btn-ghost" onClick={() => nav('/dashboard')}>←</button>
            <div className="header-title-row"><h1>{s.name}</h1>
              <button className={`btn btn-sm ${s.isOpen?'btn-danger':'btn-success'}`} onClick={toggle}>{s.isOpen?'🔴 Cerrar':'🟢 Abrir'}</button>
            </div>
            <div className="store-meta">
              <span>{D[s.districtType]||'📍'} {s.districtName}</span>
              <span>⭐ {s.stats.rating.toFixed(1)}</span>
              <span>📅 Día {day}</span>
              <span>💰 {money.toFixed(2)}€</span>
              <span>📦 {totStock}</span>
            </div>
          </div>
          <div className="store-header-actions">
            <button className="btn btn-sm btn-secondary" onClick={doRestock}>📦 Restock</button>
            <button className="btn btn-sm btn-secondary" onClick={doTick}>⏭️ Tick</button>
            <button className="btn btn-sm btn-primary" onClick={() => setTab('products')}>🛍️ Comprar</button>
          </div>
        </div>

        {/* tabs */}
        <div className="store-tabs">
          {['overview','layout','products','employees'].map(t => (
            <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
              {t==='overview'?'📊':t==='layout'?'🏗️':t==='products'?'📦':'👥'} {t}
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
            </div>
          </div>
          <div className="card">
            <h3>📅 Día {day}</h3>
            <p>🏗️ {s.shelves.length} estanterías | 👥 {s.employees.length} empleados</p>
            <p>📦 {totStock} productos | 🏭 {s.warehouse?.length||0} en almacén</p>
            {tr && <div style={{background:'var(--color-bg)',borderRadius:8,padding:10,marginTop:8}}>
              <div>👥 {tr.customers} clientes | 🛒 {tr.totalSales} ventas</div>
              <div>💰 {tr.totalRevenue.toFixed(2)}€ | 📈 {tr.totalProfit.toFixed(2)}€ ganancia</div>
            </div>}
          </div>
        </div>}

        {/* ═══ LAYOUT ═══ */}
        {tab === 'layout' && <div className="card">
          <div className="layout-header"><h3>🏗️ Tienda</h3>
            <button className="btn btn-sm btn-primary" onClick={addShelf}>+ Estantería</button>
          </div>
          <div className="store-grid">
            {s.shelves.map((sh,i) => (
              <div key={i} className="shelf-block" style={{borderColor:C[sh.category]||'#ccc'}} draggable onDragStart={()=>{}} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(i)}>
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
            <div key={si} className="card" style={{marginBottom:8}}>
              <h4 style={{color:C[sh.category],margin:'0 0 6px'}}>{I[sh.category]} {sh.category}</h4>
              {sh.products.map((sp, pi) => {
                const p = gp(sp.productId)
                return <div key={pi} className="product-row" style={{display:'flex',alignItems:'center',gap:8,padding:'4px 8',background:'var(--color-bg)',borderRadius:4,marginBottom:3,fontSize:13}}>
                  <span style={{flex:1,fontWeight:500}}>{p?.name||'?'}</span>
                  <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{sp.quantity}/{sp.maxCapacity}</span>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <input type="number" step="0.01" defaultValue={sp.price} style={{width:65,padding:'2px 4px',fontSize:12,border:'1px solid var(--color-border)',borderRadius:4,textAlign:'right'}}
                      onBlur={e => { const v = parseFloat(e.target.value); if (v && v !== sp.price) updatePrice(si, pi, v) }}
                      onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat((e.target as HTMLInputElement).value); if (v) updatePrice(si, pi, v); (e.target as HTMLInputElement).blur() } }}/>
                    <span style={{fontSize:11}}>€</span>
                  </div>
                </div>
              })}
            </div>
          ))}
          {s.shelves.every(sh => sh.products.length === 0) && <div className="card"><p style={{textAlign:'center',color:'var(--color-text-secondary)'}}>Sin productos. Pulsa Restock o el botón 🛍️ Comprar.</p></div>}

          {/* Buy modal inline */}
          <div className="card" style={{marginTop:8}}>
            <h3>🛍️ Mercado Mayorista</h3>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:8}}>💰 Tienes {money.toFixed(2)}€ — Haz clic para comprar 10 unidades</p>
            <div className="buy-grid">
              {cat.filter(x => x.isActive).slice(0,40).map(p => (
                <div key={p._id} className="buy-item" onClick={() => buy(p._id)}>
                  <span className="buy-name">{I[p.category]} {p.name}</span>
                  <span className="buy-price">{p.wholesalePrice.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ═══ EMPLOYEES ═══ */}
        {tab === 'employees' && <div className="card">
          <div className="layout-header"><h3>👥 Empleados</h3>
            <div style={{display:'flex',gap:4}}>
              {['cashier','stockist','manager','cleaner','security'].map(r => (
                <button key={r} className="btn btn-sm btn-primary" onClick={() => hire(r)}>+{r}</button>
              ))}
            </div>
          </div>
          {s.employees.map((e,i) => (
            <div key={i} className="product-row" style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12',background:'var(--color-bg)',borderRadius:6,marginBottom:4}}>
              <div style={{flex:1}}><strong>{e.name}</strong><br/><span style={{fontSize:12,color:'var(--color-text-secondary)',textTransform:'capitalize'}}>{e.role}</span></div>
              <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>💰 {e.salary}€ ⚡ {e.efficiency}x 😊 {e.happiness}%</div>
              <button className="btn btn-sm btn-danger" onClick={() => fire(i)}>✕</button>
            </div>
          ))}
          {s.employees.length === 0 && <p style={{color:'var(--color-text-secondary)',textAlign:'center'}}>Sin empleados. Contrata arriba ↑</p>}
        </div>}
      </div>
    </div>
  )
}
