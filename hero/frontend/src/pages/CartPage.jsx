import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCreditCard, FaTrashAlt, FaArrowLeft, FaExclamationTriangle, FaSearch, FaQrcode, FaBarcode, FaLink, FaWifi } from 'react-icons/fa';
import OrderSuccessAnimation from '../components/client/OrderSuccessAnimation';

// --- ESTILOS MODERNOS ---
const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    padding: '40px 20px',
    fontFamily: "'Inter', sans-serif"
  },
  wrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr', // Layout de duas colunas
    gap: '30px',
  },
  mobileWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  itemCard: {
    display: 'flex',
    gap: '15px',
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  itemImg: {
    width: '80px',
    height: '80px',
    borderRadius: '10px',
    objectFit: 'cover',
    backgroundColor: '#f1f1f1'
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  itemPrice: {
    color: '#666',
    fontSize: '14px'
  },
  removeBtn: {
    color: '#ff4d4f',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: 'auto'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  input: {
    flex: 1,
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
    fontSize: '15px',
    outline: 'none',
    transition: '0.2s'
  },
  gpsBtn: {
    padding: '12px 20px',
    backgroundColor: '#e6f7ff',
    color: '#007bff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  paymentCard: (active) => ({
    padding: '15px',
    borderRadius: '12px',
    border: active ? '2px solid #DC0000' : '1px solid #eee',
    backgroundColor: active ? '#fff5f5' : '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: '0.2s',
    color: active ? '#DC0000' : '#666'
  }),
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    height: 'fit-content',
    position: 'sticky',
    top: '20px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    fontSize: '15px',
    color: '#666'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    fontSize: '20px',
    fontWeight: '800',
    color: '#111'
  },
  checkoutBtn: (disabled) => ({
    width: '100%',
    padding: '18px',
    marginTop: '25px',
    backgroundColor: disabled ? '#ccc' : '#DC0000',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: '0.3s',
    boxShadow: disabled ? 'none' : '0 8px 20px rgba(220, 0, 0, 0.25)'
  })
};

// Helper para cálculo de distância
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper para máscara de CPF
function maskCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

export default function CartPage() {
  const { cart, removeFromCart, clearCart, total } = useContext(CartContext);
  const { signed, user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [deliveryObservation, setDeliveryObservation] = useState('');
  const [centralLocation, setCentralLocation] = useState(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('asaas_pix'); // Default to Pix
  const [stores, setStores] = useState({});
  const [estimatedFee, setEstimatedFee] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cpf, setCpf] = useState('');
  const [pixDiscount, setPixDiscount] = useState(0);
  
  // Credit Card State
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCcv, setCardCcv] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    api.get('/settings').then(res => {
      let configMap = {};
      if (Array.isArray(res.data)) {
        res.data.forEach(item => configMap[item.chave] = item.valor);
      } else if (res.data && typeof res.data === 'object') {
        configMap = res.data;
      }

      if (configMap.central_lat && configMap.central_lon) {
        setCentralLocation({
          lat: parseFloat(configMap.central_lat),
          lon: parseFloat(configMap.central_lon)
        });
      }
      if (configMap.pix_discount) {
          const discount = parseFloat(configMap.pix_discount);
          if (!isNaN(discount)) {
              setPixDiscount(discount);
          }
      }
    }).catch(err => console.error("Erro ao carregar settings", err));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Auto-detect location on mount
    getLocation();
  }, []);

  useEffect(() => {
    if (user?.cpf) {
        setCpf(user.cpf);
    }
  }, [user]);

  useEffect(() => {
    async function loadStores() {
      if (cart.length === 0) return;
      const uniqueStoreIds = [...new Set(cart.map(item => item.storeId))];
      const newStores = {};
      try {
        await Promise.all(uniqueStoreIds.map(async (id) => {
            if (stores[id]) { newStores[id] = stores[id]; return; }
            try {
                const response = await api.get(`/stores/${id}`);
                newStores[id] = response.data;
            } catch (e) { console.error(`Erro ao carregar loja ${id}`, e); }
        }));
        setStores(newStores);
      } catch (error) { console.error("Erro ao carregar lojas", error); }
    }
    loadStores();
  }, [cart]);

  useEffect(() => {
    if (!location && !address) { setEstimatedFee(null); return; }
    const storeIds = Object.keys(stores);
    if (storeIds.length === 0) return;
    let totalDist = 0;
    const needsMachine = false; // Removida lógica de maquininha (motoboy usa app)
    let currentLat, currentLon;
    let validStores = [];
    storeIds.forEach(id => {
        const s = stores[id];
        if (s && s.latitude && s.longitude) validStores.push(s);
    });
    if (validStores.length === 0) { setEstimatedFee(25.00 * storeIds.length); return; }

    if (needsMachine && centralLocation) {
        totalDist += haversineKm(centralLocation.lat, centralLocation.lon, Number(validStores[0].latitude), Number(validStores[0].longitude));
        currentLat = Number(validStores[0].latitude);
        currentLon = Number(validStores[0].longitude);
    } else {
        currentLat = Number(validStores[0].latitude);
        currentLon = Number(validStores[0].longitude);
    }

    for (let i = 0; i < validStores.length; i++) {
        const store = validStores[i];
        const sLat = Number(store.latitude);
        const sLon = Number(store.longitude);
        if (i > 0) totalDist += haversineKm(currentLat, currentLon, sLat, sLon);
        currentLat = sLat;
        currentLon = sLon;
    }

    if (location) totalDist += haversineKm(currentLat, currentLon, location.latitude, location.longitude);
    if (needsMachine && centralLocation && location) totalDist += haversineKm(location.latitude, location.longitude, centralLocation.lat, centralLocation.lon);

    const calculatedFee = 20.00 + (totalDist * 2.00);
    setEstimatedFee(parseFloat(calculatedFee.toFixed(2)));
  }, [stores, location, address, paymentMethod, centralLocation]);

  function getLocation() {
    if (!navigator.geolocation) return alert('GPS não suportado.');
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setAddress(`${addr.road || ''}, ${addr.suburb || ''} - ${addr.city || addr.town || ''}`);
            if (addr.house_number) setAddressNumber(addr.house_number);
          }
        } catch (e) { setAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); }
        setIsLoadingLocation(false);
      },
      () => { alert('Erro ao obter localização.'); setIsLoadingLocation(false); }
    );
  }

  const handleAddressSearch = async () => {
    if (!address || address.length < 3) return alert("Digite pelo menos 3 caracteres para buscar.");
    setIsSearchingAddress(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const first = data[0];
            setAddress(first.display_name);
            setLocation({ latitude: Number(first.lat), longitude: Number(first.lon) });
        } else { alert("Endereço não encontrado."); }
    } catch (error) { console.error("Search error", error); alert("Erro ao buscar endereço."); }
    finally { setIsSearchingAddress(false); }
  };

  async function handleCheckout() {
    if (cart.length === 0 || !address || !addressNumber || estimatedFee === null) {
        alert("Por favor, preencha o endereço completo e o número da residência.");
        return;
    }
    if (!signed) {
        if (window.confirm('Você precisa estar logado para finalizar o pedido. Deseja fazer login agora?')) {
            navigate('/login', { state: { from: '/cart' } });
        }
        return;
    }

    if (paymentMethod.startsWith('asaas')) {
        if (!cpf) return alert("Por favor, informe seu CPF para gerar o pagamento.");
        
        if (paymentMethod === 'asaas_credit_card') {
            if (!cardHolderName || !cardNumber || !cardExpiry || !cardCcv) {
                return alert("Preencha todos os dados do cartão.");
            }
        }

        // Atualiza CPF se necessário
        if (user && (!user.cpf || user.cpf !== cpf)) {
             try {
                 await api.put('/users/profile', { cpf });
                 if (updateUser) updateUser({ ...user, cpf });
             } catch(e) { console.error("Erro ao salvar CPF", e); return alert("Erro ao salvar CPF. Tente novamente."); }
        }
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${address}, Nº ${addressNumber}`;
      const payload = {
        items: cart.map(i => ({ 
            product_id: i.id, 
            quantity: i.quantity,
            store_id: i.storeId 
        })),
        delivery_address: fullAddress,
        delivery_observation: deliveryObservation,
        delivery_latitude: location?.latitude,
        delivery_longitude: location?.longitude,
        payment_method: paymentMethod,
        cpf: paymentMethod.startsWith('asaas') ? cpf : undefined,
        addressNumber: addressNumber
      };

      if (paymentMethod === 'asaas_credit_card') {
          payload.creditCard = {
              holderName: cardHolderName,
              number: cardNumber.replace(/\s/g, ''),
              expiryMonth: cardExpiry.split('/')[0],
              expiryYear: cardExpiry.split('/')[1],
              ccv: cardCcv
          };
      }
      
      const res = await api.post('/orders', payload);
      if (res.data.payment_info) {
          setPaymentInfo(res.data.payment_info);
      }
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Erro ao processar pedido. Tente novamente.');
      setIsSubmitting(false);
    }
  }

  const handleAnimationComplete = () => {
    clearCart();
    navigate('/client-dashboard', { state: { tab: 'orders', paymentInfo } });
  };

  const groupedItems = {};
  cart.forEach(item => {
      if (!groupedItems[item.storeId]) groupedItems[item.storeId] = [];
      groupedItems[item.storeId].push(item);
  });

  if (cart.length === 0) {
    return (
      <div style={{ ...styles.container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 0 }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</div>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Seu carrinho está vazio</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Adicione produtos incríveis para começar.</p>
        <button onClick={() => navigate('/')} style={styles.checkoutBtn(false)}>Explorar Loja</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isSuccess && <OrderSuccessAnimation onComplete={handleAnimationComplete} />}
      
      <div style={{ maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '16px' }}>
          <FaArrowLeft /> Voltar
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#333' }}>Finalizar Pedido</h1>
        </div>
        <div style={{ width: '60px' }}></div> {/* Spacer for alignment */}
      </div>

      <div style={isMobile ? styles.mobileWrapper : styles.wrapper}>
        
        <div>
          {Object.keys(groupedItems).map(storeId => (
             <div key={storeId} style={styles.section}>
               <div style={{...styles.title, borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                   🏪 {stores[storeId]?.nome || `Loja #${storeId}`}
               </div>
               {groupedItems[storeId].map(item => (
                 <div key={item.id} style={styles.itemCard}>
                   <img src={item.imagem_url || item.imageUrl} alt={item.nome || item.name} style={styles.itemImg} />
                   <div style={styles.itemContent}>
                     <div style={styles.itemName}>{item.nome || item.name}</div>
                     <div style={styles.itemPrice}>{item.quantity}x R$ {parseFloat(item.preco).toFixed(2)}</div>
                   </div>
                   <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                     <div style={{ fontWeight: 'bold' }}>R$ {(Number(item.preco) * item.quantity).toFixed(2)}</div>
                     <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}><FaTrashAlt /> Remover</button>
                   </div>
                 </div>
               ))}
             </div>
          ))}

          <div style={styles.section}>
            <div style={styles.title}><FaMapMarkerAlt color="#DC0000" /> Entrega</div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Onde devemos entregar seu pedido?</p>
            
            <div style={styles.inputGroup}>
              <div style={{ flex: 3, display: 'flex', gap: '8px' }}>
                <input 
                  style={styles.input}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Bairro ou CEP"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                />
                <button 
                  onClick={handleAddressSearch}
                  disabled={isSearchingAddress}
                  style={{
                    backgroundColor: '#DC0000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '0.2s'
                  }}
                  title="Buscar endereço"
                >
                  {isSearchingAddress ? '...' : <FaSearch />}
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  style={styles.input}
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  placeholder="Nº"
                  required
                />
              </div>
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <textarea 
                    style={{ ...styles.input, width: '100%', minHeight: '80px', resize: 'vertical' }}
                    value={deliveryObservation}
                    onChange={(e) => setDeliveryObservation(e.target.value)}
                    placeholder="Observações de entrega (ex: Ponto de referência, campainha quebrada...)"
                />
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.title}><FaCreditCard color="#DC0000" /> Pagamento</div>
            
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Escolha como deseja pagar:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Opções Online (Asaas) */}
              
              {/* 1. PIX (Destaque Total) */}
              <div 
                style={{ 
                    ...styles.paymentCard(paymentMethod === 'asaas_pix'), 
                    width: '100%', 
                    flexDirection: 'row', 
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: paymentMethod === 'asaas_pix' ? '#DCFCE7' : '#fff',
                    borderColor: paymentMethod === 'asaas_pix' ? '#16A34A' : '#eee',
                    color: paymentMethod === 'asaas_pix' ? '#166534' : '#666'
                }} 
                onClick={() => setPaymentMethod('asaas_pix')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaQrcode size={28} />
                    <div style={{ textAlign: 'left' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', display: 'block' }}>Pix (Imediato)</span>
                        {pixDiscount > 0 && (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#16A34A', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #16A34A' }}>
                                {pixDiscount}% OFF
                            </span>
                        )}
                    </div>
                </div>
              </div>
              
              {/* 2. Boleto e Cartão (Lado a Lado) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.paymentCard(paymentMethod === 'asaas_boleto')} onClick={() => setPaymentMethod('asaas_boleto')}>
                    <FaBarcode size={24} />
                    <span style={{ fontWeight: '600' }}>Boleto Bancário</span>
                </div>

                <div style={styles.paymentCard(paymentMethod === 'asaas_credit_card')} onClick={() => setPaymentMethod('asaas_credit_card')}>
                    <FaCreditCard size={24} />
                    <span style={{ fontWeight: '600' }}>Cartão de Crédito</span>
                </div>
              </div>
            </div>

            {paymentMethod === 'asaas_credit_card' && (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>Dados do Cartão</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>Nome no Cartão</label>
                          <input 
                              style={{ ...styles.input, width: '100%' }} 
                              placeholder="Como está no cartão"
                              value={cardHolderName}
                              onChange={e => setCardHolderName(e.target.value)}
                          />
                      </div>
                      <div>
                          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>Número do Cartão</label>
                          <input 
                              style={{ ...styles.input, width: '100%' }} 
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                              onChange={e => setCardNumber(e.target.value)}
                              maxLength={19}
                          />
                      </div>
                      <div style={{ display: 'flex', gap: '15px' }}>
                          <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>Validade</label>
                              <input 
                                  style={{ ...styles.input, width: '100%' }} 
                                  placeholder="MM/AAAA"
                                  value={cardExpiry}
                                  onChange={e => setCardExpiry(e.target.value)}
                                  maxLength={7}
                              />
                          </div>
                          <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>CCV</label>
                              <input 
                                  style={{ ...styles.input, width: '100%' }} 
                                  placeholder="123"
                                  value={cardCcv}
                                  onChange={e => setCardCcv(e.target.value)}
                                  maxLength={4}
                              />
                          </div>
                      </div>
                  </div>
              </div>
            )}
            
            {paymentMethod.startsWith('asaas') && !user?.cpf && (
                <div style={{ marginTop: '15px' }}>
                     <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>CPF (Para nota/pagamento)</label>
                     <input 
                        style={styles.input}
                        value={cpf}
                        onChange={(e) => setCpf(maskCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                     />
                     <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        * Obrigatório para gerar a cobrança.
                     </div>
                </div>
            )}


          </div>
        </div>

        {/* COLUNA DA DIREITA: RESUMO */}
        <div>
           <div style={styles.summaryCard}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Resumo do Pedido</h2>
              <div style={styles.row}>
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              {paymentMethod === 'asaas_pix' && pixDiscount > 0 && (
                  <div style={{ ...styles.row, color: '#16A34A', fontWeight: 'bold' }}>
                    <span>Desconto Pix ({pixDiscount}%)</span>
                    <span>- R$ {(total * (pixDiscount / 100)).toFixed(2)}</span>
                  </div>
              )}

              <div style={styles.row}>
                <span>Taxa de Entrega</span>
                <span>{estimatedFee !== null ? `R$ ${estimatedFee.toFixed(2)}` : 'Calculando...'}</span>
              </div>

              <div style={styles.totalRow}>
                <span>Total</span>
                <span>
                    R$ {(
                        total - (paymentMethod === 'asaas_pix' ? (total * (pixDiscount / 100)) : 0) + (estimatedFee || 0)
                    ).toFixed(2)}
                </span>
              </div>

              <button 
                onClick={handleCheckout} 
                style={styles.checkoutBtn(isSubmitting || estimatedFee === null)}
                disabled={isSubmitting || estimatedFee === null}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Pedido'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
