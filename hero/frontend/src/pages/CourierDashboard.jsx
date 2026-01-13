import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FaBars, FaMotorcycle, FaFileAlt, FaWallet, FaUser, FaBoxOpen, FaTimes } from 'react-icons/fa';

// Modular Tabs
import DeliveriesTab from './courier-dashboard/DeliveriesTab';
import ProfileTab from './courier-dashboard/ProfileTab';
import MotoTab from './courier-dashboard/MotoTab';
import DocsTab from './courier-dashboard/DocsTab';
import FinanceTab from './courier-dashboard/FinanceTab';

// --- ESTILOS ---
const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#F4F7F6', fontFamily: 'system-ui, sans-serif' },
  sidebar: (isOpen) => ({
    position: 'fixed', left: 0, top: 0, bottom: 0, width: '250px', backgroundColor: '#fff', 
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)', zIndex: 1000, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out', padding: '20px'
  }),
  overlay: (isOpen) => ({
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
    display: isOpen ? 'block' : 'none'
  }),
  mainContent: { flex: 1, padding: '16px', maxWidth: '100%', marginLeft: 0, transition: '0.3s' }, // Mobile first
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#333' },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', borderRadius: '12px',
    backgroundColor: active ? '#FFF0F0' : 'transparent', color: active ? '#DC0000' : '#333',
    fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', marginBottom: '8px', textDecoration: 'none'
  }),
  statusBtn: (isOnline) => ({
    padding: '8px 15px', borderRadius: '25px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
    backgroundColor: isOnline ? '#28a745' : '#6c757d', color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  })
};

function CourierDashboard() {
  const { user, signOut } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [finishedOrders, setFinishedOrders] = useState([]);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [alerting, setAlerting] = useState(false); // Estado para alerta sonoro persistente
  const [ignoredOrders, setIgnoredOrders] = useState([]); // Pedidos ignorados/recusados nesta sessão
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('deliveries');

  // Refs para áudio e controle de novos pedidos
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const prevOrdersCount = useRef(0);

  // Efeito para som em loop
  useEffect(() => {
    if (!alerting) return;
    const loop = setInterval(() => {
      audioRef.current.play().catch(() => console.log("Interação necessária para áudio"));
    }, 4000); // Toca a cada 4s
    return () => clearInterval(loop);
  }, [alerting]);

  // 1. Alternar Status Online/Offline
  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await api.put('/users/online', { is_online: newStatus });
      setIsOnline(newStatus);
      if (!newStatus) setAlerting(false); // Para som se ficar offline
    } catch (error) {
      console.error("Erro ao alterar status", error);
    }
  };

  // 2. Lógica de Localização
  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        setLocError('');
        try { await api.put('/users/location', { latitude, longitude }); } catch (e) {}
      },
      () => setLocError('GPS desligado ou sem permissão'),
      { enableHighAccuracy: true }
    );
  }, []);

  // 3. Carregar Pedidos e Som de Alerta
  const loadOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders');
      
      // Meus pedidos ativos (aceitos e não entregues)
      const myActive = data.filter(o => String(o.courier_id) === String(user?.id) && o.status !== 'delivered');
      
      // Pedidos disponíveis para todos (prontos para coleta e sem entregador)
      // REGRA: Se tiver pedido ativo, NÃO vê novos pedidos
      // REGRA: Não mostrar pedidos ignorados nesta sessão
      let available = [];
      if (myActive.length === 0) {
        available = data.filter(o => 
          ['pending', 'accepted', 'ready_for_pickup'].includes(o.status) 
          && !o.courier_id
          && !ignoredOrders.includes(o.id)
        );
      }
      
      // Meus pedidos finalizados
      const finished = data.filter(o => String(o.courier_id) === String(user?.id) && o.status === 'delivered');

      // Tocar som se houver novos pedidos disponíveis
      if (available.length > 0 && isOnline) {
        setAlerting(true);
      } else {
        setAlerting(false);
      }
      prevOrdersCount.current = available.length;

      setMyDeliveries(myActive);
      setAvailableOrders(available);
      setFinishedOrders(finished);
      
      // Mantemos 'orders' como a união para compatibilidade se necessário, mas vamos usar os específicos
      setOrders([...myActive, ...available]); 
      
      setDeliveredCount(finished.length);
      setTotalEarnings(finished.reduce((acc, o) => acc + (Number(o.delivery_fee) || 0), 0));
    } catch (e) {
      console.error("Erro ao carregar pedidos");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isOnline, ignoredOrders]); // Incluído ignoredOrders na dependência

  // Efeitos de ciclo de vida
  useEffect(() => {
    loadOrders();
    const poll = setInterval(loadOrders, 15000); // Poll a cada 15s
    return () => clearInterval(poll);
  }, [loadOrders]);

  useEffect(() => {
    let locInterval;
    const toggleStatus = async () => {
      try { await api.put('/users/online', { is_online: isOnline }); } catch (e) {}
    };

    toggleStatus();
    if (isOnline) {
      updateLocation();
      locInterval = setInterval(updateLocation, 30000);
    }
    return () => clearInterval(locInterval);
  }, [isOnline, updateLocation]);

  // 3. Atualizar Status com Trava de Segurança
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (e) {
      alert("Erro na conexão.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Confirmar Entrega (com código)
  const handleConfirmDelivery = async (orderId, code) => {
    // Código agora vem do modal interno do Tab
    if (!code) return;

    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
        const response = await api.post(`/orders/${orderId}/confirm`, { code });
        // Removido alert para fluxo automático
        // alert(response.data.message || "Etapa concluída com sucesso! 🚀");
        await loadOrders();
        return response.data;
    } catch (e) {
        alert("Erro: " + (e.response?.data?.error || "Código inválido ou falha na conexão"));
        throw e; // Lança erro para o modal saber que falhou
    } finally {
        setIsUpdating(false);
    }
  };

  // 5. Ignorar Pedido
  const handleIgnoreOrder = (orderId) => {
    setIgnoredOrders(prev => [...prev, orderId]);
  };

  // RENDERIZAÇÃO DA SIDEBAR
  const renderSidebar = () => (
    <>
      <div style={styles.overlay(isSidebarOpen)} onClick={() => setIsSidebarOpen(false)} />
      <div style={styles.sidebar(isSidebarOpen)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#DC0000' }}>Menu</h2>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <FaTimes />
            </button>
        </div>
        
        <div style={styles.navItem(activeTab === 'deliveries')} onClick={() => { setActiveTab('deliveries'); setIsSidebarOpen(false); }}>
            <FaBoxOpen /> Entregas
        </div>
        <div style={styles.navItem(activeTab === 'profile')} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}>
            <FaUser /> Meus Dados
        </div>
        <div style={styles.navItem(activeTab === 'moto')} onClick={() => { setActiveTab('moto'); setIsSidebarOpen(false); }}>
            <FaMotorcycle /> Dados da Moto
        </div>
        <div style={styles.navItem(activeTab === 'docs')} onClick={() => { setActiveTab('docs'); setIsSidebarOpen(false); }}>
            <FaFileAlt /> Documentos
        </div>
        <div style={styles.navItem(activeTab === 'finance')} onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}>
            <FaWallet /> Financeiro
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <button onClick={signOut} style={{ ...styles.navItem(false), color: 'red', width: '100%' }}>Sair</button>
        </div>
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      {renderSidebar()}

      <div style={styles.mainContent}>
        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => setIsSidebarOpen(true)} style={styles.menuBtn}>
            <FaBars />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {activeTab === 'deliveries' ? 'Entregas' : 
             activeTab === 'profile' ? 'Meus Dados' : 
             activeTab === 'moto' ? 'Minha Moto' : 
             activeTab === 'docs' ? 'Documentos' : 'Financeiro'}
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)} 
            style={styles.statusBtn(isOnline)}
          >
            {isOnline ? 'CONECTADO' : 'DESCONECTADO'}
          </button>
        </div>

        {/* CONTEÚDO MODULAR */}
        {activeTab === 'deliveries' && (
          <DeliveriesTab 
            myDeliveries={myDeliveries}
            availableOrders={availableOrders}
            finishedOrders={finishedOrders} // Passando histórico
            isLoading={isLoading}
            isUpdating={isUpdating}
            onUpdateStatus={handleUpdateStatus}
            onConfirmDelivery={handleConfirmDelivery}
            onIgnoreOrder={handleIgnoreOrder} // Novo prop
            totalEarnings={totalEarnings}
            deliveredCount={deliveredCount}
          />
        )}
        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'moto' && <MotoTab />}
        {activeTab === 'docs' && <DocsTab />}
        {activeTab === 'finance' && (
          <FinanceTab 
            finishedOrders={finishedOrders}
            totalEarnings={totalEarnings}
            user={user}
          />
        )}

      </div>
    </div>
  );
}

export default CourierDashboard;