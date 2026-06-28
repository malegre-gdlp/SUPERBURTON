import React, { useEffect, useState } from 'react'
import { useGame } from '../engine/GameContext'
import { catalogApi, economyApi } from '../api'
import type { Product, Category, PriceRange } from '../types'
import './Catalog.css'

export default function Catalog() {
  const { state } = useGame()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null)

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, search])

  const loadCategories = async () => {
    try {
      const { data } = await catalogApi.getCategories()
      setCategories(data.categories)
    } catch {}
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data } = await catalogApi.getAll({
        category: selectedCategory || undefined,
        search: search || undefined
      })
      setProducts(data.products)
    } catch {}
    setLoading(false)
  }

  const showProductDetails = async (product: Product) => {
    setSelectedProduct(product)
    try {
      const { data } = await economyApi.getWholesaleRange(product._id)
      setPriceRange(data.range)
    } catch {}
  }

  const categoryIcons: Record<string, string> = {
    alimentacion: '🍎', bebidas: '🥤', limpieza: '🧹',
    mascotas: '🐾', electronica: '💻', jardineria: '🌿',
    farmacia: '💊', moda: '👕', juguetes: '🎮'
  }

  return (
    <div className="page catalog-page">
      <div className="container">
        <div className="catalog-header">
          <h1>📦 Catálogo de Productos</h1>
          <p className="text-secondary">{products.length} productos disponibles</p>
        </div>

        {/* Search & Filter */}
        <div className="catalog-controls">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Categories */}
        <div className="category-pills">
          <button
            className={`pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton product-skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-4">
            {products.map(product => (
              <div
                key={product._id}
                className="product-card card"
                onClick={() => showProductDetails(product)}
              >
                <div className="product-card-icon">
                  {categoryIcons[product.category] || '📦'}
                </div>
                <div className="product-card-info">
                  <h3 className="product-name">{product.name}</h3>
                  <span className="product-brand">{product.brand}</span>
                </div>
                <div className="product-card-tags">
                  <span className="badge badge-info">{product.subcategory}</span>
                  <span className="badge badge-primary">★ {product.quality}</span>
                </div>
                <div className="product-card-pricing">
                  <div className="price-row">
                    <span>Mayorista</span>
                    <span className="price-value">{product.wholesalePrice.toFixed(2)}€</span>
                  </div>
                  <div className="price-row">
                    <span>PVP ref.</span>
                    <span className="price-value">{product.basePrice.toFixed(2)}€</span>
                  </div>
                </div>
                {product.isSeasonal && (
                  <span className="badge badge-warning seasonal-badge">🌙 Temporada</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && priceRange && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{categoryIcons[selectedProduct.category]} {selectedProduct.name}</h2>
                <button className="btn btn-ghost" onClick={() => setSelectedProduct(null)}>✕</button>
              </div>

              <div className="product-detail-grid">
                <div className="pd-section">
                  <h4>Información básica</h4>
                  <div className="pd-row"><span>Marca</span><span>{selectedProduct.brand}</span></div>
                  <div className="pd-row"><span>Categoría</span><span>{selectedProduct.category}</span></div>
                  <div className="pd-row"><span>Subcategoría</span><span>{selectedProduct.subcategory}</span></div>
                  <div className="pd-row"><span>Unidad</span><span>{selectedProduct.unit}</span></div>
                  <div className="pd-row"><span>Calidad</span><span>★ {selectedProduct.quality}/100</span></div>
                  <div className="pd-row"><span>Rareza</span><span>💎 {selectedProduct.rarity}/100</span></div>
                </div>

                <div className="pd-section">
                  <h4>Rango de precio mayorista</h4>
                  <div className="price-range-display">
                    <div className="pr-item">
                      <span className="pr-label">Mínimo</span>
                      <span className="pr-value pr-min">{priceRange.min.toFixed(2)}€</span>
                    </div>
                    <div className="pr-item">
                      <span className="pr-label">Sugerido</span>
                      <span className="pr-value pr-sug">{priceRange.suggested.toFixed(2)}€</span>
                    </div>
                    <div className="pr-item">
                      <span className="pr-label">Máximo</span>
                      <span className="pr-value pr-max">{priceRange.max.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="pd-section">
                  <h4>Modificadores de precio</h4>
                  {priceRange.modifiers && Object.entries(priceRange.modifiers).map(([key, val]) => (
                    <div key={key} className="pd-row">
                      <span>{key}</span>
                      <span>{(typeof val === 'number' ? val * 100 : 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>

                <div className="pd-section">
                  <h4>Datos de mercado</h4>
                  <div className="pd-row"><span>Demanda</span><span>{(selectedProduct.demandFactor * 100).toFixed(0)}%</span></div>
                  <div className="pd-row"><span>Competidores</span><span>{selectedProduct.competitionCount}</span></div>
                  <div className="pd-row"><span>Coste fabricación</span><span>{selectedProduct.manufacturingCost.toFixed(2)}€</span></div>
                  {selectedProduct.isSeasonal && (
                    <div className="pd-row"><span>Temporada</span><span>Meses {selectedProduct.seasonMonths.join(', ')}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
