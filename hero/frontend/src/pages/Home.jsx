import React, { useEffect, useState, useContext, useMemo } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { Menu } from 'lucide-react';

// --- ESTILOS INTERNOS ---
const styles = {
  hero: {
    backgroundColor: '#DC0000', // Cor sólida igual ao navbar
    color: '#fff',
    padding: '40px 20px',
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '-1px' // Pequeno ajuste para garantir que não haja linha branca
  },
  searchContainer: {
    maxWidth: '600px',
    margin: '-50px auto 30px',
    padding: '0 20px',
    position: 'relative',
    zIndex: 10
  },
  searchInput: {
    width: '100%',
    padding: '18px 25px',
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    fontSize: '16px',
    outline: 'none'
  },
  container: {
    display: 'flex',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    gap: '30px',
    minHeight: '600px'
  },
  sidebar: {
    width: '250px',
    flexShrink: 0,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
    position: 'sticky',
    top: '20px'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '800',
    marginBottom: '15px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  categoryItem: (active) => ({
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: active ? '#DC0000' : '#555',
    backgroundColor: active ? '#FEF2F2' : 'transparent',
    fontWeight: active ? 'bold' : 'normal',
    marginBottom: '5px',
    transition: '0.2s',
    '&:hover': {
      backgroundColor: '#f9f9f9',
      color: '#DC0000'
    }
  }),
  productGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
    alignContent: 'start'
  },
  productCard: {
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    transition: '0.2s',
    height: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  badge: {
    backgroundColor: '#f1f1f1',
    color: '#666',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
};

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);
        setProducts(prodRes.data);
        setCategories(['Todas', ...catRes.data]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtro de Produtos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = activeCategory === 'Todas' || product.categoria === activeCategory;
      const matchesSearch = 
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, activeCategory]);

  const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* HERO SECTION */}
      <div style={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <img src="/logo2.png" alt="Campinas Tech Delivery" style={{ maxWidth: '280px', height: 'auto', filter: 'drop-shadow(3px 0 0 white) drop-shadow(-3px 0 0 white) drop-shadow(0 3px 0 white) drop-shadow(0 -3px 0 white)' }} />
        </div>
        <p style={{ marginTop: '0px', opacity: 1.9, fontSize: '1.2rem', fontWeight: '500' }}>
          Delivery de TUDO com entrega em até 30 minutos
        </p>
      </div>

      {/* SEARCH BAR */}
      <div style={styles.searchContainer}>
        <input 
          style={styles.searchInput}
          placeholder="O que você está procurando? (ex: SSD, Mouse, iPhone, Brinquedo)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.container}>
        
        {/* SIDEBAR */}
        <div style={styles.sidebar} className="hidden md:block">
          <div style={styles.sidebarTitle}>
            <Menu size={20} />
            Categorias
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map(cat => (
              <div 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={styles.categoryItem(activeCategory === cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCT LIST (GRID) */}
        <div style={{ flex: 1 }}>
          
          {/* Mobile Category Select (Visible only on small screens) */}
          <div className="md:hidden mb-4">
            <select 
              className="w-full p-3 rounded-lg border bg-white"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              <p>Buscando melhores ofertas...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '12px' }}>
              <h3>Nenhum produto encontrado.</h3>
              <p style={{ color: '#666' }}>Tente mudar o termo da busca ou a categoria.</p>
            </div>
          ) : (
            <div style={styles.productGrid}>
              {filteredProducts.map(product => (
                <div key={product.id} style={styles.productCard} className="hover:shadow-lg">
                  <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <img 
                        src={product.imagem_url || 'https://via.placeholder.com/150'} 
                        alt={product.nome} 
                        style={{ width: '100%', height: '180px', objectFit: 'contain', borderRadius: '8px' }} 
                      />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#333', fontWeight: '600', lineHeight: '1.4' }}>
                        {product.nome}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px 0', height: '32px', overflow: 'hidden' }}>
                        {product.descricao?.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  </Link>
                    
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '800', color: '#333', fontSize: '18px' }}>
                        {money(product.preco)}
                      </span>
                    </div>

                    <button
                        onClick={() => {
                          addToCart({ ...product, preco: Number(product.preco) }, product.loja_id);
                          // Feedback visual
                          const btn = document.getElementById(`btn-add-${product.id}`);
                          if(btn) {
                              const originalText = btn.innerText;
                              btn.innerText = 'Adicionado!';
                              btn.style.backgroundColor = '#2ecc71';
                              btn.style.borderColor = '#2ecc71';
                              btn.style.color = '#fff';
                              setTimeout(() => {
                                btn.innerText = originalText;
                                btn.style.backgroundColor = '#fff';
                                btn.style.borderColor = '#DC0000';
                                btn.style.color = '#DC0000';
                              }, 1500);
                          }
                        }}
                        id={`btn-add-${product.id}`}
                        style={{ 
                          width: '100%',
                          padding: '10px', 
                          backgroundColor: '#fff', 
                          color: '#DC0000', 
                          border: '1px solid #DC0000', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          transition: '0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          if (e.target.innerText !== 'Adicionado!') {
                            e.target.style.backgroundColor = '#DC0000';
                            e.target.style.color = '#fff';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (e.target.innerText !== 'Adicionado!') {
                            e.target.style.backgroundColor = '#fff';
                            e.target.style.color = '#DC0000';
                          }
                        }}
                      >
                        Adicionar ao Carrinho
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
