import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CartContext } from '../contexts/CartContext';

// --- ESTILOS PROFISSIONAIS (LAYOUT E-COMMERCE) ---
const styles = {
  container: { backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  breadcrumb: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontSize: '14px', color: '#666' },
  wrapper: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' },
  
  // Área da Imagem
  imageContainer: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', position: 'sticky', top: '20px' },
  image: { maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.3s ease', cursor: 'zoom-in' },
  
  // Área de Informações
  infoContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  title: { fontSize: '26px', fontWeight: '600', color: '#333', lineHeight: '1.3' },
  storeBadge: { display: 'inline-block', fontSize: '13px', color: '#007bff', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' },
  
  priceCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  oldPrice: { textDecoration: 'line-through', color: '#999', fontSize: '14px' },
  price: { fontSize: '36px', fontWeight: '800', color: '#DC0000', margin: '5px 0' },
  installments: { fontSize: '15px', color: '#555', marginBottom: '20px' },
  
  // Frete
  shippingBox: { border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  cepInput: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' },
  
  // Botões
  actions: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' },
  btnBuy: { padding: '16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  btnCart: { padding: '16px', backgroundColor: '#eef2ff', color: '#333', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },

  // Descrição
  descSection: { maxWidth: '1200px', margin: '40px auto 0', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  specsTable: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  specRow: { borderBottom: '1px solid #eee' },
  specKey: { padding: '12px', width: '30%', fontWeight: '600', color: '#555', backgroundColor: '#f9f9f9' },
  specVal: { padding: '12px', color: '#333' }
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cep, setCep] = useState('');
  const [shippingEstimate, setShippingEstimate] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // Tenta buscar o produto. 
        // IMPORTANTE: Seu backend precisa ter uma rota GET /products/:id
        // Se não tiver, você terá que filtrar de uma lista maior, mas o ideal é a rota direta.
        const res = await api.get(`/products/${id}`); // Ajuste conforme seu backend
        setProduct(res.data);
        
        // Se o produto tiver loja_id, busca a loja
        if (res.data.loja_id) {
            const storeRes = await api.get(`/stores/${res.data.loja_id}`);
            setStore(storeRes.data);
        }
      } catch (err) {
        console.error("Erro ao carregar produto", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleCalcFrete = () => {
      if (cep.length < 8) return alert("Digite um CEP válido");
      // Simulação de frete
      setShippingEstimate({ price: 14.90, days: '1 a 3 dias úteis' });
  };

  const handleBuyNow = () => {
      addToCart(product, product.loja_id);
      navigate('/cart');
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Carregando detalhes...</div>;
  if (!product) return <div style={{padding:'50px', textAlign:'center'}}>Produto não encontrado.</div>;

  // Cálculos visuais
  const price = Number(product.preco);
  const fakeOldPrice = price * 1.25; // Simula um preço "De" 25% mais caro
  const installmentValue = (price / 12 * 1.1).toFixed(2); // Simula juros leves

  return (
    <div style={styles.container}>
      {/* Navegação (Breadcrumb) */}
      <div style={styles.breadcrumb}>
        <Link to="/" style={{textDecoration:'none', color:'#666'}}>Home</Link> &gt; 
        {store && <Link to={`/store/${store.id}`} style={{textDecoration:'none', color:'#666'}}> {store.nome} </Link>} &gt;
        <span style={{color:'#333', fontWeight:'bold'}}> {product.nome.substring(0, 30)}...</span>
      </div>

      <div style={styles.wrapper}>
        
        {/* ESQUERDA: Imagem */}
        <div style={styles.imageContainer}>
            <img 
                src={product.imagem_url || 'https://via.placeholder.com/500'} 
                alt={product.nome} 
                style={styles.image}
                referrerPolicy="no-referrer"
                onMouseMove={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
        </div>

        {/* DIREITA: Informações e Compra */}
        <div style={styles.infoContainer}>
            <div>
                {store && (
                    <div style={styles.storeBadge} onClick={() => navigate(`/store/${store.id}`)}>
                        Vendido e entregue por: {store.nome} ›
                    </div>
                )}
                <h1 style={styles.title}>{product.nome}</h1>
                <p style={{color:'#f59e0b', fontSize:'14px', marginTop:'5px'}}>★★★★★ (Novo)</p>
            </div>

            <div style={styles.priceCard}>
                <div style={styles.oldPrice}>De R$ {fakeOldPrice.toFixed(2)}</div>
                <div style={styles.price}>R$ {price.toFixed(2)}</div>
                <div style={styles.installments}>
                    à vista no Pix ou em até <strong>12x de R$ {installmentValue}</strong>
                </div>

                {/* Simulador de Frete */}
                <div style={styles.shippingBox}>
                    <span style={{fontSize:'20px'}}>🚚</span>
                    <div style={{flex:1}}>
                        <div style={{display:'flex', gap:'10px'}}>
                            <input 
                                placeholder="Calcular frete (CEP)" 
                                value={cep}
                                onChange={e => setCep(e.target.value)}
                                style={styles.cepInput}
                            />
                            <button onClick={handleCalcFrete} style={{padding:'0 15px', borderRadius:'6px', border:'none', backgroundColor:'#333', color:'#fff', cursor:'pointer'}}>OK</button>
                        </div>
                        {shippingEstimate && (
                            <div style={{marginTop:'8px', fontSize:'14px', color:'#28a745'}}>
                                <strong>Sedex:</strong> R$ {shippingEstimate.price.toFixed(2)} • Chega em {shippingEstimate.days}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.actions}>
                    <button style={styles.btnBuy} onClick={handleBuyNow}>COMPRAR AGORA</button>
                    <button style={styles.btnCart} onClick={() => { addToCart({ ...product, preco: Number(product.preco) }, product.loja_id); alert('Adicionado!'); }}>ADICIONAR AO CARRINHO</button>
                </div>
            </div>
        </div>
      </div>

      {/* RODAPÉ: Descrição Técnica */}
      <div style={styles.descSection}>
          <h2 style={{borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'20px'}}>Descrição do Produto</h2>
          <div 
            style={{lineHeight:'1.6', color:'#444'}}
            dangerouslySetInnerHTML={{ __html: product.descricao || 'O vendedor não forneceu uma descrição detalhada para este produto.' }}
          />

          <h3 style={{marginTop:'40px'}}>Ficha Técnica</h3>
          <table style={styles.specsTable}>
              <tbody>
                  <tr style={styles.specRow}><td style={styles.specKey}>Categoria</td><td style={styles.specVal}>{product.categoria || 'Geral'}</td></tr>
                  <tr style={styles.specRow}><td style={styles.specKey}>Estoque</td><td style={styles.specVal}>{product.estoque > 0 ? `${product.estoque} unidades` : 'Indisponível'}</td></tr>
                  <tr style={styles.specRow}><td style={styles.specKey}>Garantia</td><td style={styles.specVal}>3 meses contra defeitos de fabricação</td></tr>
                  <tr style={styles.specRow}><td style={styles.specKey}>Código</td><td style={styles.specVal}>#{product.id}</td></tr>
              </tbody>
          </table>
      </div>
    </div>
  );
}

export default ProductDetails;