import { useState, useMemo, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');

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

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.categoria));
    return ['Todas', ...Array.from(cats)].sort();
  }, [products]);

  const handleDownloadPDF = async () => {
    // Hide search bar and categories for PDF
    const searchEl = document.querySelector('.search-container');
    const categoryEl = document.querySelector('.categories-container');
    if(searchEl) searchEl.style.display = 'none';
    if(categoryEl) categoryEl.style.display = 'none';

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

    // Restore search bar and categories
    if(searchEl) searchEl.style.display = 'flex';
    if(categoryEl) categoryEl.style.display = 'flex';
    document.body.style.overflow = originalOverflow;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.subcategoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || p.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, products, selectedCategory]);

  return (
    <div className="app-container" id="catalog-content">
      <main>
        <div className="hero-banner">
          <div className="hero-content">
            <h2>Variedad de víveres e insumos</h2>
          </div>
        </div>

        <div className="search-container glass-panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por producto, marca o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={handleDownloadPDF}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            PDF
          </button>
        </div>

        <div className="categories-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0', marginBottom: '20px' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`badge ${selectedCategory === cat ? 'active' : 'badge-outline'}`}
              style={{
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                opacity: selectedCategory === cat ? 1 : 0.7,
                background: selectedCategory === cat ? 'var(--accent-gradient)' : 'transparent',
                color: selectedCategory === cat ? 'white' : 'inherit',
                border: selectedCategory === cat ? 'none' : '1px solid rgba(14,165,233, 0.3)',
                padding: '0.4rem 1rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading" style={{textAlign: 'center', padding: '2rem'}}>Cargando productos...</div>
        ) : (
          <div className="catalog-grid">
            {filteredProducts.map(item => (
              <article key={item.id} className="product-card glass-panel">
                <img src={item.image} alt={item.producto} className="product-image" loading="lazy" />
                <div className="product-info">
                  <h3>{item.producto}</h3>
                  
                  <div className="badges">
                    <span className="badge">{item.categoria}</span>
                    <span className="badge badge-outline">{item.marca}</span>
                  </div>
                  
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Presentación</span>
                      <span className="value">{item.presentacion}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">U. Medida</span>
                      <span className="value">{item.unidad}</span>
                    </div>
                  </div>

                  <div className="product-footer">
                    <span className="price">S/ {item.precio.toFixed(2)}</span>
                    <button className="add-btn" aria-label={`Añadir ${item.producto}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && (
              <div className="no-results">
                <p>No se encontraron productos para "{searchTerm}" {selectedCategory !== 'Todas' ? `en la categoría ${selectedCategory}` : ''}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
