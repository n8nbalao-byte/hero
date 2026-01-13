import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import OrderHistory from './OrderHistory';
import ClientSettings from './ClientSettings';

const styles = {
  container: {
    display: 'flex',
    minHeight: 'calc(100vh - 75px)', // Adjust based on navbar height
    backgroundColor: '#f8f9fa'
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#fff',
    borderRight: '1px solid #e5e7eb',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto'
  },
  menuItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: active ? '#DC0000' : '#4b5563',
    backgroundColor: active ? '#FEF2F2' : 'transparent',
    fontWeight: active ? '600' : '500',
    transition: 'all 0.2s',
    fontSize: '15px'
  }),
  sidebarTitle: {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    fontWeight: '700',
    marginBottom: '15px',
    paddingLeft: '16px',
    letterSpacing: '0.05em'
  }
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTitle}>
          Painel do Cliente
        </div>
        
        <div 
          style={styles.menuItem(activeTab === 'orders')}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={20} />
          Meus Pedidos / Rastreio
        </div>

        <div 
          style={styles.menuItem(activeTab === 'profile')}
          onClick={() => setActiveTab('profile')}
        >
          <User size={20} />
          Meus Dados
        </div>
      </aside>

      <main style={styles.content}>
        {activeTab === 'orders' && (
           <div>
             {/* OrderHistory já possui título e container, mas podemos envolver se necessário */}
             <OrderHistory />
           </div>
        )}
        {activeTab === 'profile' && <ClientSettings />}
      </main>
    </div>
  );
}
