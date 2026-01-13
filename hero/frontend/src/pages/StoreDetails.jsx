import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CartContext } from '../contexts/CartContext';

// --- ESTILOS ---
const styles = {
  container: { backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  headerBanner: (bannerUrl) => ({
    height: '250px',
    background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : 'linear-gradient(to right, #2c3e50, #4ca1af)',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0 20px',
    borderRadius: '0 0 20px 20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  }),
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    borderRadius: '0 0 20px 20px'
  },
  headerContent: {
    maxWidth: '1000px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '-30px',
    position: 'relative',
    zIndex: 2
  },
  logo: {
    width: '100px', height: '100px', borderRadius: '15px', border: '4px solid #fff',
    backgroundColor: '#fff', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  storeInfo: { marginBottom: '35px', color: '#fff' },
  statusBadge: (isOpen) => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    backgroundColor: isOpen ? '#28a745' : '#dc3545',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    marginLeft: '10px'
  }),
  main: { maxWidth: '1000px', margin: '50px auto 0', padding: '0 20px 40px' },
  controls: {
    display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px',
    paddingBottom: '20px', borderBottom: '1px solid #eee'
  },
  searchBar: {
    padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd',
    width: '100%', fontSize: '16px', boxSizing: 'border-box'
  },
  categories: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' },
  catPill: (active) => ({
    padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd',
    backgroundColor: active ? '#DC0000' : '#fff',
    color: active ? '#fff' : '#555',
    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '500', transition: '0.2s'
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee',
    display: 'flex', flexDirection: 'column', transition: 'transform 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  cardImg: { width: '100%', height: '160px', objectFit: 'contain', padding: '10px', boxSizing: 'border-box' },
  cardBody: { padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' },
  price: { fontSize: '18px', fontWeight: 'bold', color: '#DC0000', margin: '10px 0' },
  btnAdd: (isOpen) => ({
    width: '100%', padding: '10px', borderRadius: '6px',
    backgroundColor: isOpen ? '#fff' : '#f0f0f0',
    color: isOpen ? '#DC0000' : '#999',
    border: isOpen ? '1px solid #DC0000' : '1px solid #ddd',
    fontWeight: 'bold', cursor: isOpen ? 'pointer' : 'not-allowed',
    marginTop: 'auto', transition: '0.2s'
  }),
  backLink: {
    position: 'absolute', top: '20px', left: '20px',
    backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px 15px', borderRadius: '20px',
    textDecoration: 'none', color: '#333', fontWeight: 'bold', fontSize: '14px',
    display: 'flex', alignItems: 'center', gap: '5px'
  },
  toast: {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px'
  }
};

function StoreDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros Locais
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [toastMsg, setToastMsg] = useState('');

  // Lógica de "Loja Aberta"
  const isOpen = useMemo(() => {
    if (!store) return false;
    
    // Override manual do admin
    if (store.status_loja === 'fechada') return false;
    if (store.status_loja === 'aberta') return true;

    // Se não tiver override ou for outro status, checa horários
    if (!store.horarios_funcionamento) return true;
    try {
      const hours = typeof store.horarios_funcionamento === 'string' ? JSON.parse(store.horarios_funcionamento) : store.horarios_funcionamento;
      const dayIdx = new Date().getDay(); 
      const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const key = map[dayIdx];
      const cfg = hours[key];
      
      if (!cfg || !cfg.open) return false;
      
      const now = new Date();
      const [fromH, fromM] = (cfg.from || '00:00').split(':').map(Number);
      const [toH, toM] = (cfg.to || '23:59').split(':').map(Number);
      
      const from = new Date(now); from.setHours(fromH, fromM, 0, 0);
      const to = new Date(now); to.setHours(toH, toM, 0, 0);
      
      return now >= from && now <= to;
    } catch { return true; }
  }, [store]);

  useEffect(() => {
    async function loadData() {
      try {
        const [storeRes, prodRes] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/stores/${id}/products`)
        ]);
        setStore(storeRes.data);
        setProducts(prodRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Derivar categorias únicas dos produtos
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.categoria || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || p.categoria === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  // Helper para remover HTML das descrições nos cards
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleAddToCart = (product) => {
    if (!isOpen) return;
    addToCart(product, store.id);
    
    // Feedback visual (Toast)
    setToastMsg(`${product.nome} adicionado!`);
    setTimeout(() => setToastMsg(''), 2000);
  };

  if (isLoading || !store) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Carregando catálogo da loja...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* HEADER BANNER */}
      <div style={styles.headerBanner(store.banner_url || store.banner)}>
        <div style={styles.headerOverlay} />
        <Link to="/" style={{...styles.backLink, zIndex: 3}}>← Voltar</Link>
        <div style={styles.headerContent}>
          <img 
            src={store.logo || store.imagem_url || 'https://via.placeholder.com/150'} 
            alt={store.nome} 
            style={styles.logo} 
            referrerPolicy="no-referrer"
          />
          <div style={styles.storeInfo}>
            <h1 style={{ margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{store.nome}</h1>
            <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>
              {store.categoria} • {store.endereco}
              <span style={styles.statusBadge(isOpen)}>
                {isOpen ? 'ABERTA AGORA' : 'FECHADA'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        {/* CONTROLES DE BUSCA E FILTRO */}
        <div style={styles.controls}>
          <input 
            style={styles.searchBar} 
            placeholder={`Buscar em ${store.nome}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          
          <div style={styles.categories}>
            {categories.map(cat => (
              <div 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={styles.catPill(activeCategory === cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* ALERTA DE LOJA FECHADA */}
        {!isOpen && (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
            🔒 <strong>Loja Fechada:</strong> Você pode navegar pelos produtos, mas não conseguirá finalizar o pedido agora.
          </div>
        )}

        {/* GRID DE PRODUTOS */}
        {filteredProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>Nenhum produto encontrado.</p>
        ) : (
          <div style={styles.grid}>
            {filteredProducts.map(product => (
              <div key={product.id} style={styles.card}>
                <img 
                  src={product.imagem_url || 'https://via.placeholder.com/200'} 
                  alt={product.nome} 
                  style={styles.cardImg} 
                  referrerPolicy="no-referrer"
                />
                <div style={styles.cardBody}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#333' }}>{product.nome}</h3>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4', flex: 1 }}>
                    {stripHtml(product.descricao).substring(0, 80)}{stripHtml(product.descricao).length > 80 && '...'}
                  </p>
                  <div style={styles.price}>R$ {parseFloat(product.preco).toFixed(2)}</div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={!isOpen}
                    style={styles.btnAdd(isOpen)}
                    onMouseOver={(e) => isOpen && (e.currentTarget.style.backgroundColor = '#DC0000', e.currentTarget.style.color = '#fff')}
                    onMouseOut={(e) => isOpen && (e.currentTarget.style.backgroundColor = '#fff', e.currentTarget.style.color = '#DC0000')}
                  >
                    {isOpen ? 'Adicionar' : 'Indisponível'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={styles.toast}>
          ✅ {toastMsg}
        </div>
      )}
    </div>
  );
}

export default StoreDetails;