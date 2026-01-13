import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import OrderTrackingMap from '../components/client/OrderTrackingMap';
import DeliveryRouteAnimation from '../components/client/DeliveryRouteAnimation';
import { Copy, X } from 'lucide-react';

// Estilos Profissionais
const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fcfcfc' },
  orderCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee' },
  statusBadge: (status) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
    ...getStatusColor(status)
  }),
  courierInfo: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', marginTop: '15px', border: '1px solid #eee' },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: '24px', padding: '40px 32px', width: '90%', maxWidth: '420px',
    textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative'
  }
};

const statusTranslations = {
  pending: 'Pendente',
  accepted: 'Em Preparação',
  ready_for_pickup: 'Aguardando Coleta',
  delivering: 'Saiu para Entrega',
  delivered: 'Entregue',
  canceled: 'Cancelado'
};

function getStatusColor(s) {
  const map = {
    pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    accepted: { backgroundColor: '#E0F2FE', color: '#0369A1' },
    ready_for_pickup: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    delivering: { backgroundColor: '#D1FAE5', color: '#065F46' },
    delivered: { backgroundColor: '#F3F4F6', color: '#374151' },
    canceled: { backgroundColor: '#FEE2E2', color: '#991B1B' }
  };
  return map[s] || map.pending;
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [trackingOrders, setTrackingOrders] = useState({}); // { [orderId]: boolean }
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (location.state?.paymentInfo) {
      setPaymentInfo(location.state.paymentInfo);
      setShowPaymentModal(true);
      // Limpar o state para não reabrir ao dar refresh ou navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Código Pix copiado!');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentInfo(null);
  };

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await api.get('/orders');
        // Ordenar: mais recentes primeiro
        if (Array.isArray(response.data)) {
            const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setOrders(sorted);
        } else {
            console.warn("Resposta da API não é um array:", response.data);
            setOrders([]);
        }
      } catch (error) { console.error("Erro ao carregar pedidos", error); setOrders([]); }
    }
    loadOrders();

    const interval = setInterval(loadOrders, 10000); // Auto-refresh a cada 10s
    return () => clearInterval(interval);
  }, []);

  const toggleTracking = (orderId) => {
    setTrackingOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: '#DC0000', marginBottom: '30px' }}>Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#999' }}>Você ainda não realizou pedidos de eletrônicos.</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={styles.orderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{order.store?.nome || 'Loja de Tecnologia'}</h3>
                <span style={{ fontSize: '13px', color: '#888' }}>Pedido #{order.id} • {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <span style={styles.statusBadge(order.status)}>{statusTranslations[order.status] || order.status}</span>
            </div>

            <div style={{ margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                  <span>{item.quantidade}x {item.product?.nome}</span>
                  <span style={{ fontWeight: 'bold' }}>R$ {(Number(item.preco_momento) * (item.quantidade || 1)).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                  <span>Taxa de Entrega:</span>
                  <span>R$ {Number(order.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontWeight: 'bold', fontSize: '16px' }}>
                  <span>Total:</span>
                  <span>R$ {Number(order.valor_total || order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ROTA ANIMADA E ETAPAS */}
            {['accepted', 'ready_for_pickup', 'delivering'].includes(order.status) && (
                 <DeliveryRouteAnimation order={order} />
            )}

            {/* SEÇÃO DE ENTREGA EM TEMPO REAL */}
            {order.status === 'delivering' && (
              <div style={{ borderTop: '2px dashed #eee', paddingTop: '20px' }}>
                
                {/* CÓDIGO DE ENTREGA */}
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '5px' }}>Informe este código ao entregador:</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>{order.delivery_code || '----'}</div>
                </div>

                <div style={styles.courierInfo}>
                  <img src={order.courier?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png'} alt="Courier" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{order.courier?.name || 'Entregador Parceiro'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{order.courier?.vehicle_type} • {order.courier?.vehicle_plate}</div>
                  </div>
                  <button onClick={() => window.open(`https://wa.me/${order.courier?.phone}`)} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>WhatsApp</button>
                </div>

                {!trackingOrders[order.id] ? (
                  <button onClick={() => toggleTracking(order.id)} style={{ width: '100%', marginTop: '15px', padding: '12px', backgroundColor: '#DC0000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Acompanhar Entrega
                  </button>
                ) : (
                  <>
                    <button onClick={() => toggleTracking(order.id)} style={{ marginTop: '10px', fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Ocultar Mapa
                    </button>
                    <OrderTrackingMap order={order} />
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* MODAL DE PAGAMENTO (PIX / BOLETO / CARTÃO) */}
      {showPaymentModal && paymentInfo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={closePaymentModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="#666" />
            </button>
            
            <div style={{ width: '60px', height: '60px', backgroundColor: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: '30px' }}>
                {paymentInfo.billingType === 'PIX' ? '💠' : 
                 paymentInfo.billingType === 'BOLETO' ? '📄' : 
                 paymentInfo.billingType === 'CREDIT_CARD' ? '💳' : '💰'}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>
                {paymentInfo.billingType === 'PIX' ? 'Pagamento via Pix' : 
                 paymentInfo.billingType === 'BOLETO' ? 'Pagamento via Boleto' : 
                 paymentInfo.billingType === 'CREDIT_CARD' ? 'Pagamento Cartão' : 'Pagamento Gerado'}
            </h2>
            
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '25px' }}>
              {paymentInfo.billingType === 'PIX' ? 'Escaneie o QR Code ou copie o código abaixo.' : 
               paymentInfo.billingType === 'BOLETO' ? 'Clique no botão abaixo para visualizar e imprimir seu boleto.' :
               'Confira os detalhes do seu pagamento abaixo.'}
            </p>

            {/* ÁREA PIX */}
            {paymentInfo.billingType === 'PIX' && (
                <>
                    {paymentInfo.pixQrCode && (
                    <div style={{ padding: '15px', border: '2px dashed #E5E7EB', borderRadius: '16px', marginBottom: '20px', display: 'inline-block' }}>
                        <img src={`data:image/png;base64,${paymentInfo.pixQrCode}`} alt="Pix QRCode" style={{ width: '180px', height: '180px' }} />
                    </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F3F4F6', padding: '12px', borderRadius: '12px', marginBottom: '25px' }}>
                    <input 
                        readOnly 
                        value={paymentInfo.pixCopyPaste || ''} 
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#374151', fontSize: '13px', textOverflow: 'ellipsis' }}
                    />
                    <button onClick={() => copyToClipboard(paymentInfo.pixCopyPaste)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}>
                        <Copy size={18} />
                    </button>
                    </div>
                </>
            )}

            {/* ÁREA BOLETO */}
             {paymentInfo.billingType === 'BOLETO' && (
                 <div style={{ marginBottom: '25px' }}>
                     {paymentInfo.bankSlipUrl ? (
                         <a 
                             href={paymentInfo.bankSlipUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             style={{
                                 display: 'inline-block',
                                 backgroundColor: '#DC0000',
                                 color: '#fff',
                                 padding: '15px 30px',
                                 borderRadius: '12px',
                                 textDecoration: 'none',
                                 fontWeight: 'bold',
                                 fontSize: '16px',
                                 boxShadow: '0 4px 6px rgba(220, 0, 0, 0.2)'
                             }}
                         >
                             Visualizar Boleto Bancário
                         </a>
                     ) : (
                         <p style={{color: '#999'}}>Carregando boleto...</p>
                     )}
                 </div>
             )}

             {/* ÁREA GERAL / CARTÃO / OUTROS */}
             {paymentInfo.invoiceUrl && paymentInfo.billingType !== 'BOLETO' && (
               <div style={{ marginTop: '10px', marginBottom: '20px' }}>
                 <a href={paymentInfo.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', fontSize: '14px' }}>
                   Visualizar Fatura / Comprovante
                 </a>
               </div>
             )}

            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              Após o pagamento, seu pedido será processado automaticamente.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;