import { useState, useMemo, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todas');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetch('https://productos-api-lrh2.onrender.com/productos')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(p => ({
          id: p.id,
          producto: p.nombre_producto || '',
          categoria: p.subcategorias?.categorias?.nombre || 'Sin categoría',
          subcategoria: p.subcategorias?.nombre || '',
          marca: p.marcas?.nombre || 'Sin marca',
          presentacion: p.presentacion || '',
          unidad: p.unidades_medida?.nombre || '',
          precio: p.precio_venta || 0,
          image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400&h=400"
        }));
        setProducts(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  // Build category → subcategories tree
  const categoryTree = useMemo(() => {
    const tree = {};
    products.forEach(p => {
      const cat = p.categoria || 'Sin categoría';
      const sub = p.subcategoria || '';
      if (!tree[cat]) tree[cat] = new Set();
      if (sub) tree[cat].add(sub);
    });
    // Convert sets to sorted arrays
    const result = {};
    Object.keys(tree).sort().forEach(cat => {
      result[cat] = Array.from(tree[cat]).sort();
    });
    return result;
  }, [products]);

  const categories = useMemo(() => ['Todas', ...Object.keys(categoryTree)], [categoryTree]);

  const subcategories = useMemo(() => {
    if (selectedCategory === 'Todas') return [];
    return categoryTree[selectedCategory] || [];
  }, [selectedCategory, categoryTree]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('Todas');
    if (cat !== 'Todas') {
      setExpandedCategories(prev => ({ ...prev, [cat]: true }));
    }
  };

  const toggleExpand = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDownloadPDF = async () => {
    const sidebarEl = document.querySelector('.sidebar');
    const searchEl = document.querySelector('.topbar');
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (searchEl) searchEl.style.display = 'none';

    const element = document.getElementById('catalog-content');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';

    const opt = {
      margin: 0.5,
      filename: 'catalogo-viveres.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();

    if (sidebarEl) sidebarEl.style.display = '';
    if (searchEl) searchEl.style.display = '';
    document.body.style.overflow = originalOverflow;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || p.categoria === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'Todas' || p.subcategoria === selectedSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [searchTerm, products, selectedCategory, selectedSubcategory]);

  const totalByCategory = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    });
    return counts;
  }, [products]);

  const totalBySubcategory = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const key = `${p.categoria}__${p.subcategoria}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🛒</span>
          <h1 className="sidebar-title">Víveres</h1>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Cerrar sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">Categorías</p>

          {/* "Todas" option */}
          <button
            className={`cat-item ${selectedCategory === 'Todas' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('Todas')}
          >
            <span className="cat-icon">🏷️</span>
            <span className="cat-name">Todas</span>
            <span className="cat-count">{products.length}</span>
          </button>

          {/* Category list with expandable subcategories */}
          {categories.filter(c => c !== 'Todas').map(cat => {
            const subs = categoryTree[cat] || [];
            const isExpanded = expandedCategories[cat];
            const isActive = selectedCategory === cat;

            return (
              <div key={cat} className="cat-group">
                <div className={`cat-item ${isActive ? 'active' : ''}`}>
                  <button
                    className="cat-main-btn"
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span className="cat-icon">📦</span>
                    <span className="cat-name">{cat}</span>
                    <span className="cat-count">{totalByCategory[cat] || 0}</span>
                  </button>
                  {subs.length > 0 && (
                    <button
                      className="cat-expand-btn"
                      onClick={() => toggleExpand(cat)}
                      aria-label="Expandir subcategorías"
                    >
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategories */}
                {subs.length > 0 && isExpanded && (
                  <div className="subcats">
                    <button
                      className={`subcat-item ${isActive && selectedSubcategory === 'Todas' ? 'active' : ''}`}
                      onClick={() => { setSelectedCategory(cat); setSelectedSubcategory('Todas'); }}
                    >
                      <span>Todas en {cat}</span>
                      <span className="cat-count">{totalByCategory[cat] || 0}</span>
                    </button>
                    {subs.map(sub => (
                      <button
                        key={sub}
                        className={`subcat-item ${isActive && selectedSubcategory === sub ? 'active' : ''}`}
                        onClick={() => { setSelectedCategory(cat); setSelectedSubcategory(sub); }}
                      >
                        <span>{sub}</span>
                        <span className="cat-count">{totalBySubcategory[`${cat}__${sub}`] || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-wrap">

        {/* TOPBAR */}
        <header className="topbar">
          {!sidebarOpen && (
            <button className="sidebar-toggle-inline" onClick={() => setSidebarOpen(true)} aria-label="Abrir sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar producto, marca, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')} aria-label="Limpiar búsqueda">✕</button>
            )}
          </div>
          <button className="btn-pdf" onClick={handleDownloadPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </button>
        </header>

        {/* HERO */}
        <div id="catalog-content">
          <div className="hero-banner">
            <div className="hero-overlay"/>
            <div className="hero-content">
              <h2>Catálogo de Víveres e Insumos</h2>
              <p>Encuentra todo lo que necesitas en un solo lugar</p>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-num">{products.length}</span>
                <span className="stat-label">Productos</span>
              </div>
              <div className="hero-stat">
                <span className="stat-num">{Object.keys(categoryTree).length}</span>
                <span className="stat-label">Categorías</span>
              </div>
              <div className="hero-stat">
                <span className="stat-num">{filteredProducts.length}</span>
                <span className="stat-label">Resultados</span>
              </div>
            </div>
          </div>

          {/* Breadcrumb / active filter */}
          <div className="breadcrumb-bar">
            <span className={`crumb ${selectedCategory === 'Todas' ? 'crumb-active' : ''}`}>
              {selectedCategory === 'Todas' ? 'Todos los productos' : selectedCategory}
            </span>
            {selectedSubcategory !== 'Todas' && (
              <>
                <span className="crumb-sep">›</span>
                <span className="crumb crumb-active">{selectedSubcategory}</span>
              </>
            )}
            <span className="crumb-count">{filteredProducts.length} productos</span>
          </div>

          {/* PRODUCT GRID */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"/>
              <p>Cargando productos...</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {filteredProducts.map(item => (
                <article key={item.id} className="product-card">
                  <div className="card-image-wrap">
                    <img src={item.image} alt={item.producto} className="product-image" loading="lazy" />
                    <span className="card-cat-badge">{item.categoria}</span>
                  </div>
                  <div className="product-info">
                    <h3>{item.producto}</h3>
                    <span className="product-brand">{item.marca}</span>
                    {item.subcategoria && (
                      <span className="product-subcat">{item.subcategoria}</span>
                    )}
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Presentación</span>
                        <span className="value">{item.presentacion || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">U. Medida</span>
                        <span className="value">{item.unidad || '—'}</span>
                      </div>
                    </div>
                    <div className="product-footer">
                      <span className="price">S/ {item.precio.toFixed(2)}</span>
                      <button className="add-btn" aria-label={`Añadir ${item.producto}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredProducts.length === 0 && (
                <div className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <p>No se encontraron productos{searchTerm ? ` para "${searchTerm}"` : ''}{selectedCategory !== 'Todas' ? ` en ${selectedCategory}` : ''}</p>
                  <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); setSelectedSubcategory('Todas'); }}>
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App