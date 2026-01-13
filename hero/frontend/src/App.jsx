import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { CartProvider, CartContext } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// --- PÁGINAS ---
import Home from './pages/Home';
import StoreDetails from './pages/StoreDetails';
import ProductDetails from './pages/ProductDetails'; // <--- NOVO IMPORT
import Login from './pages/Login';
import Register from './pages/Register';
import ShopDashboard from './pages/ShopDashboard';
import CourierDashboard from './pages/CourierDashboard';
import AdminDashboard from './pages/AdminDashboard'; // <--- Importar
import CartPage from './pages/CartPage';
import OrderHistory from './pages/OrderHistory';
import ClientSettings from './pages/ClientSettings';
import ClientDashboard from './pages/ClientDashboard'; // <--- NOVO


import './App.css';

import { FaShoppingCart } from 'react-icons/fa';

function NavBar() {
  const { user, signOut } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const location = useLocation();

  return (
    <nav style={{ padding: '15px', backgroundColor: '#DC0000', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {user && user.tipo === 'admin' ? (
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2em' }}>Painel Administrativo</span>
      ) : (
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
           {location.pathname !== '/' && (
              <img src="/logo.png" alt="Home" style={{ height: '45px', objectFit: 'contain', filter: 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white)' }} />
           )}
        </Link>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user ? (
          <>
            <span>Olá, {user.nome}</span>
            {user.tipo === 'client' && (
               <>
                 <Link to="/client-dashboard" state={{ tab: 'orders' }} style={{ color: '#fff', textDecoration: 'none', marginRight: '15px' }}>Meus Pedidos</Link>
                 <Link to="/client-dashboard" state={{ tab: 'profile' }} style={{ color: '#fff', textDecoration: 'none', marginRight: '15px' }}>Minha Conta</Link>
                 <Link to="/cart" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaShoppingCart size={20} />
                    {cart.length > 0 && <span style={{ backgroundColor: '#fff', color: '#DC0000', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }}>{cart.length}</span>}
                 </Link>
               </>
            )}
            {user.tipo === 'courier' && (
              <Link to="/courier-dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Entregas</Link>
            )}
            {user.tipo === 'shop_owner' && (
              <Link to="/shop-dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Loja</Link>
            )}
            <button onClick={signOut} style={{ background: 'none', border: '1px solid #fff', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>
          </>
        ) : (
          <>
             <Link to="/cart" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '15px' }}>
                <FaShoppingCart size={20} />
                {cart.length > 0 && <span style={{ backgroundColor: '#fff', color: '#DC0000', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }}>{cart.length}</span>}
             </Link>
             <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login / Cadastro</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function NotificationsPanel({ notifications, onClear }) {
  if (notifications.length === 0) return null;
  return (
    <div style={{ position: 'fixed', right: '16px', top: '70px', zIndex: 9999, width: '320px' }}>
      {notifications.slice(-5).map((n, idx) => (
        <div
          key={idx}
          onClick={() => window.location.reload()}
          style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #DC0000', borderRadius: '6px', padding: '10px', marginBottom: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', cursor: 'pointer' }}
        >
          <div style={{ fontWeight: 'bold' }}>{n.title}</div>
          <div style={{ fontSize: '0.9em', color: '#333' }}>{n.body}</div>
          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>#{n.order_id} · {n.type}</div>
        </div>
      ))}
      <button onClick={onClear} style={{ width: '100%', padding: '8px', backgroundColor: '#f1f3f5', border: '1px solid #ddd', borderRadius: '6px' }}>
        Limpar notificações
      </button>
    </div>
  );
}

function NotificationStream({ onNotification }) {
  const { user } = useContext(AuthContext);
  
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        try { oscillator.stop(); ctx.close(); } catch { void 0; }
      }, 200);
    } catch { void 0; }
  }

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  }

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const src = new EventSource(`http://localhost:3000/notifications/stream?token=${token}`);
    
    src.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onNotification?.(data);
        playBeep();

        // TTS para Lojista
        if (data.type === 'order_created' && user?.role === 'shop_owner') {
           speak('Você recebeu um novo pedido!');
        }

        // Recarrega a página em eventos críticos para garantir sincronia visual imediata
        if (['delivery_accepted', 'order_delivered', 'status_updated', 'order_created', 'new_delivery_available'].includes(data.type)) {
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (e) {
        console.warn('Falha ao processar notificação', e);
      }
    };
    
    src.onerror = () => {
      src.close();
    };
    return () => src.close();
  }, [user, onNotification]);
  
  return null;
}

function App() {
  const [notifications, setNotifications] = useState([]);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <NavBar />
          
          <NotificationStream onNotification={(n) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const withMeta = { ...n, _id: id, _ts: Date.now() };
            setNotifications(prev => [...prev, withMeta]);
            setTimeout(() => {
              setNotifications(prev => prev.filter(x => x._id !== id));
            }, 10000);
          }} />
          
          <NotificationsPanel notifications={notifications} onClear={() => setNotifications([])} />
          
          <Routes>
            {/* ROTAS PÚBLICAS */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<CartPage />} /> {/* <--- TORNADO PÚBLICO */}
            
            <Route path="/store/:id" element={<StoreDetails />} />
            <Route path="/product/:id" element={<ProductDetails />} /> {/* <--- NOVA ROTA PÚBLICA */}
            
            {/* ROTAS PROTEGIDAS - CLIENTE */}
            <Route path="/client-dashboard" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <OrderHistory />
                </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientSettings />
                </ProtectedRoute>
            } />

            {/* ROTAS PROTEGIDAS - LOJISTA */}
            <Route path="/shop-dashboard" element={
                <ProtectedRoute allowedRoles={['shop_owner']}>
                    <ShopDashboard />
                </ProtectedRoute>
            } />

            {/* ROTAS PROTEGIDAS - MOTOBOY */}
            <Route path="/courier-dashboard" element={
                <ProtectedRoute allowedRoles={['courier']}>
                    <CourierDashboard />
                </ProtectedRoute>
            } />

            {/* ROTAS PROTEGIDAS - ADMIN MASTER */}
            <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;