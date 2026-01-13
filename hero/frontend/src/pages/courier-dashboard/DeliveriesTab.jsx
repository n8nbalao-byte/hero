import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { MapPin, Navigation, Clock, CreditCard, Package, CheckCircle, Store, User, ChevronRight } from 'lucide-react';

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1e293b'
  },
  // Cards
  orderCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '0', marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e2e8f0'
  },
  cardHeader: {
    padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  cardBody: { padding: '24px' },
  
  // Route Visualization
  routeContainer: { position: 'relative', paddingLeft: '10px' },
  routeStep: (status) => ({ // status: 'pending', 'active', 'completed'
    display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative',
    opacity: status === 'pending' ? 0.4 : 1,
    filter: status === 'pending' ? 'grayscale(100%)' : 'none',
    transition: 'all 0.3s ease'
  }),
  stepIcon: (color, isActive) => ({
    width: '40px', height: '40px', borderRadius: '50%', 
    backgroundColor: isActive ? color : '#f1f5f9', 
    color: isActive ? '#fff' : '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 2,
    boxShadow: isActive ? `0 4px 12px ${color}66` : 'none',
    border: isActive ? 'none' : '2px solid #e2e8f0'
  }),
  stepLine: (isCompleted) => ({
    position: 'absolute', top: '40px', left: '19px', width: '2px', height: 'calc(100% + 10px)',
    backgroundColor: isCompleted ? '#22c55e' : '#e2e8f0', zIndex: 1,
    transition: 'background-color 0.3s ease'
  }),
  stepContent: { flex: 1 },
  stepTitle: { fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' },
  stepAddress: { fontSize: '16px', fontWeight: '600', color: '#1e293b', lineHeight: '1.4' },
  
  // Stats Bar
  statsBar: {
    display: 'flex', gap: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginTop: '20px',
    border: '1px solid #e2e8f0'
  },
  statItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  statValue: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a' },

  // Buttons
  btnAction: (color, disabled) => ({
    width: '100%', padding: '18px', backgroundColor: disabled ? '#cbd5e1' : color, color: '#fff',
    border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', 
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'all 0.2s',
    boxShadow: disabled ? 'none' : `0 8px 20px ${color}40`,
    marginTop: '24px',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  }),
  btnGps: {
    color: '#2563eb', fontSize: '13px', border: '1px solid #bfdbfe', background: '#eff6ff', 
    cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', marginTop: '8px', 
    fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px',
    transition: '0.2s'
  },
  
  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: '24px', padding: '40px 32px', width: '90%', maxWidth: '420px',
    textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  codeInputsContainer: {
    display: 'flex', gap: '12px', justifyContent: 'center', margin: '32px 0'
  },
  codeInput: {
    width: '64px', height: '72px', fontSize: '32px', textAlign: 'center', borderRadius: '16px',
    border: '2px solid #e2e8f0', outline: 'none', fontWeight: '800', color: '#1e293b',
    backgroundColor: '#f8fafc', transition: 'border-color 0.2s',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
  }
};

export default function DeliveriesTab({ 
  myDeliveries,
  availableOrders,
  finishedOrders = [],
  isLoading, 
  isUpdating, 
  onUpdateStatus, 
  onConfirmDelivery,
  onIgnoreOrder,
  totalEarnings,
  deliveredCount
}) {
  const [activeSubTab, setActiveSubTab] = useState('active');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [modalStepTitle, setModalStepTitle] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [settings, setSettings] = useState({
    central_address: "Central de Distribuição",
    central_lat: -22.9009724,
    central_lon: -47.0580713
  });

  // Load Settings
  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data) {
        setSettings({
          central_address: res.data.central_address || "Central de Distribuição",
          central_lat: Number(res.data.central_lat) || -22.9009724,
          central_lon: Number(res.data.central_lon) || -47.0580713
        });
      }
    }).catch(console.error);
  }, []);

  // --- HELPERS ---
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getRouteInfo = useCallback((order) => {
    const needsMachine = ['credit_card', 'debit_card'].includes(order.payment_method);
    
    // Fallback: usar frete para estimar distância se não houver coordenadas
    const clientDist = Math.max(0, (Number(order.delivery_fee) - 20) / 2);
    
    let machineDist = 0;
    if (needsMachine && order.store_latitude && order.store_longitude && settings.central_lat) {
      machineDist = calculateDistance(
        settings.central_lat, settings.central_lon,
        order.store_latitude, order.store_longitude
      );
    }

    const totalDist = clientDist + machineDist;
    const totalTime = Math.ceil((totalDist * 3) + 15); // 3 min/km + 15 min base

    return { needsMachine, totalDist, totalTime, clientDist, machineDist };
  }, [calculateDistance, settings]);

  // Determinar Etapa Atual
  const getStepInfo = (order) => {
    const needsMachine = ['credit_card', 'debit_card'].includes(order.payment_method);
    let currentStep = 'unknown'; // machine | store | client
    let stepTitle = '';
    let btnText = '';
    let btnColor = '#3b82f6';
    let codeSource = '';

    if (order.step_status === 'pending') {
        if (needsMachine) {
            currentStep = 'machine';
            stepTitle = 'Ir para Central (Retirar Maquininha)';
            btnText = 'Confirmar Retirada da Maquininha';
            btnColor = '#f59e0b'; // Amber
            codeSource = 'ADMIN';
        } else {
            currentStep = 'store';
            stepTitle = 'Ir para Loja (Coletar Pedido)';
            btnText = 'Confirmar Coleta do Produto';
            btnColor = '#3b82f6'; // Blue
            codeSource = 'LOJA';
        }
    } else if (order.step_status === 'machine_collected') {
        currentStep = 'store';
        stepTitle = 'Ir para Loja (Coletar Pedido)';
        btnText = 'Confirmar Coleta do Produto';
        btnColor = '#3b82f6'; // Blue
        codeSource = 'LOJA';
    } else if (order.step_status === 'product_collected') {
        currentStep = 'client';
        stepTitle = 'Ir para Cliente (Entregar)';
        btnText = 'Finalizar Entrega';
        btnColor = '#22c55e'; // Green
        codeSource = 'CLIENTE';
    }

    return { currentStep, stepTitle, btnText, btnColor, codeSource };
  };

  const getBatchStepInfo = (orders) => {
    // 1. Machine Step
    const needsMachine = orders.some(o => ['credit_card', 'debit_card'].includes(o.payment_method));
    const pendingMachine = orders.some(o => 
        ['credit_card', 'debit_card'].includes(o.payment_method) && o.step_status === 'pending'
    );
    const isMachineDone = !pendingMachine;

    // 2. Stores Step
    const storeGroups = {};
    orders.forEach(o => {
        if (!storeGroups[o.store_id]) {
            storeGroups[o.store_id] = {
                storeId: o.store_id,
                storeName: o.store_name || o.store?.name || 'Loja',
                storeAddress: o.store_address || o.store?.address || '',
                orders: [],
                status: 'pending' // pending, completed
            };
        }
        storeGroups[o.store_id].orders.push(o);
    });

    let allStoresDone = true;
    let activeStoreId = null;

    Object.values(storeGroups).forEach(group => {
        const isStoreDone = group.orders.every(o => ['product_collected', 'delivered'].includes(o.step_status));
        group.status = isStoreDone ? 'completed' : 'pending';
        if (!isStoreDone) allStoresDone = false;
        
        if (!isStoreDone && !activeStoreId) {
            activeStoreId = group.storeId;
        }
    });

    // 3. Client Step
    const isDelivered = orders.every(o => o.status === 'delivered');

    let currentStep = 'unknown';
    if (needsMachine && !isMachineDone) {
        currentStep = 'machine';
    } else if (!allStoresDone) {
        currentStep = 'store';
    } else if (!isDelivered) {
        currentStep = 'client';
    } else {
        currentStep = 'completed';
    }

    return { needsMachine, isMachineDone, storeGroups, allStoresDone, isDelivered, currentStep, activeStoreId };
  };

  // Handle Code Input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const openConfirmModal = (orderId, title) => {
      setSelectedOrderId(orderId);
      setModalStepTitle(title);
      setCode(['','','','']);
      setConfirmModalOpen(true);
  };

  const submitCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) return alert('Digite o código de 4 dígitos');
    
    try {
        await onConfirmDelivery(selectedOrderId, fullCode);
        setConfirmModalOpen(false);
    } catch (e) {
        setCode(['','','','']);
        setTimeout(() => document.getElementById(`code-input-0`).focus(), 100);
    }
  };

  const openNavigation = (address) => {
    if (!address) return alert('Endereço não disponível');
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  // --- GROUPING LOGIC ---
  const groupedAvailable = React.useMemo(() => {
    const batchMap = new Map();
    const result = [];

    (availableOrders || []).forEach(order => {
        if (order.batch_id) {
            if (!batchMap.has(order.batch_id)) batchMap.set(order.batch_id, []);
            batchMap.get(order.batch_id).push(order);
        } else {
            result.push({ type: 'single', data: order });
        }
    });

    batchMap.forEach((orders, batchId) => {
        result.push({ type: 'batch', data: orders, id: batchId });
    });

    return result;
  }, [availableOrders]);

  const groupedActive = React.useMemo(() => {
    const batchMap = new Map();
    const result = [];

    (myDeliveries || []).forEach(order => {
        if (order.batch_id) {
            if (!batchMap.has(order.batch_id)) batchMap.set(order.batch_id, []);
            batchMap.get(order.batch_id).push(order);
        } else {
            result.push({ type: 'single', data: order });
        }
    });

    batchMap.forEach((orders, batchId) => {
        result.push({ type: 'batch', data: orders, id: batchId });
    });

    return result;
  }, [myDeliveries]);

  return (
    <div style={styles.container}>
      {/* --- CONFIRMATION MODAL --- */}
      {confirmModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#2563eb', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)' }}>
                    <CreditCard size={48} />
                </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                {modalStepTitle}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '16px', lineHeight: '1.5' }}>
                Solicite o código de 4 dígitos para confirmar esta etapa.
            </p>
            
            <div style={styles.codeInputsContainer}>
                {[0, 1, 2, 3].map((idx) => (
                    <input
                        key={idx}
                        id={`code-input-${idx}`}
                        type="tel"
                        maxLength="1"
                        value={code[idx]}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        style={styles.codeInput}
                        autoFocus={idx === 0}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                    onClick={() => setConfirmModalOpen(false)}
                    style={{ ...styles.btnAction('#f1f5f9', false), backgroundColor: '#f1f5f9', color: '#64748b', boxShadow: 'none', marginTop: 0 }}
                >
                    Cancelar
                </button>
                <button 
                    onClick={submitCode}
                    style={{ ...styles.btnAction('#2563eb', false), marginTop: 0, boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}
                >
                    Confirmar
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STATS HEADER --- */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', borderRadius: '24px', padding: '30px', color: '#fff', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
        <div>
            <div style={{ fontSize: '14px', opacity: 0.8, fontWeight: '500', marginBottom: '4px' }}>Ganhos hoje</div>
            <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>R$ {totalEarnings.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>{deliveredCount}</div>
            <div style={{ fontSize: '14px', opacity: 0.8, fontWeight: '500' }}>Entregas concluídas</div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '16px' }}>
        <button onClick={() => setActiveSubTab('active')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeSubTab === 'active' ? '#fff' : 'transparent', color: activeSubTab === 'active' ? '#0f172a' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: activeSubTab === 'active' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
            EM ANDAMENTO
        </button>
        <button onClick={() => setActiveSubTab('history')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeSubTab === 'history' ? '#fff' : 'transparent', color: activeSubTab === 'history' ? '#0f172a' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: activeSubTab === 'history' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
            HISTÓRICO
        </button>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '18px' }}>Carregando pedidos...</div>}

      {!isLoading && activeSubTab === 'active' && (
        <>
            {/* --- NOVOS PEDIDOS (DISPONÍVEIS) --- */}
            {groupedAvailable.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Novas Entregas Disponíveis ({availableOrders.length})
                    </h4>
                    {groupedAvailable.map(item => {
                         if (item.type === 'single') {
                             const order = item.data;
                             const { totalDist, totalTime } = getRouteInfo(order);
                             return (
                                <div key={order.id} style={{ ...styles.orderCard, border: '2px solid #3b82f6' }}>
                                    <div style={{ ...styles.cardHeader, backgroundColor: '#eff6ff' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>Nova Oferta #{order.id}</span>
                                            </div>
                                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>R$ {Number(order.delivery_fee).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#2563eb', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} /> {totalTime} min
                                            </span>
                                            <span style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Navigation size={14} /> {totalDist.toFixed(1)} km
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>RETIRADA</div>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{order.store_name}</div>
                                            <div style={{ fontSize: '13px', color: '#475569' }}>{order.store_address}</div>
                                        </div>
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>ENTREGA</div>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{order.client_name}</div>
                                            <div style={{ fontSize: '13px', color: '#475569' }}>{order.delivery_address}</div>
                                            {order.delivery_observation && (
                                                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '12px', color: '#9a3412' }}>
                                                    <strong>Obs:</strong> {order.delivery_observation}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, 'accepted')}
                                            disabled={isUpdating}
                                            style={{ ...styles.btnAction('#2563eb', isUpdating), marginTop: 0 }}
                                        >
                                            ACEITAR CORRIDA
                                        </button>
                                        <button 
                                            onClick={() => onIgnoreOrder && onIgnoreOrder(order.id)}
                                            disabled={isUpdating}
                                            style={{ ...styles.btnAction('#ef4444', isUpdating), marginTop: '12px', backgroundColor: '#fee2e2', color: '#dc2626', boxShadow: 'none' }}
                                        >
                                            RECUSAR
                                        </button>
                                    </div>
                                </div>
                             );
                         } else {
                             // --- BATCH CARD ---
                             const orders = item.data;
                             const firstOrder = orders[0];
                             const totalFee = orders.reduce((acc, o) => acc + Number(o.delivery_fee), 0);
                             // Estimativa acumulada (aproximada)
                             const totalTime = orders.reduce((acc, o) => acc + getRouteInfo(o).totalTime, 0); // Soma simples, pode ser superestimada mas ok
                             const totalDist = orders.reduce((acc, o) => acc + getRouteInfo(o).totalDist, 0);

                             return (
                                <div key={`batch-${item.id}`} style={{ ...styles.orderCard, border: '2px solid #4338ca' }}>
                                    <div style={{ ...styles.cardHeader, backgroundColor: '#e0e7ff' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4338ca', textTransform: 'uppercase' }}>PACOTE MULTI-LOJA ({orders.length})</span>
                                                <span style={{ fontSize: '10px', backgroundColor: '#4338ca', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: '700' }}>
                                                    📦 BATCH
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>R$ {totalFee.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#4338ca', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} /> ~{totalTime} min
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>COLETAS ({orders.length})</div>
                                            {orders.map((o, idx) => (
                                                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <Store size={14} color="#475569" />
                                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{o.store_name}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>ENTREGA ÚNICA</div>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{firstOrder.client_name}</div>
                                            <div style={{ fontSize: '13px', color: '#475569' }}>{firstOrder.delivery_address}</div>
                                            {firstOrder.delivery_observation && (
                                                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '12px', color: '#9a3412' }}>
                                                    <strong>Obs:</strong> {firstOrder.delivery_observation}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => onUpdateStatus(firstOrder.id, 'accepted')} // Backend aceita todos
                                            disabled={isUpdating}
                                            style={{ ...styles.btnAction('#4338ca', isUpdating), marginTop: 0 }}
                                        >
                                            ACEITAR PACOTE
                                        </button>
                                        <button 
                                            onClick={() => orders.forEach(o => onIgnoreOrder && onIgnoreOrder(o.id))}
                                            disabled={isUpdating}
                                            style={{ ...styles.btnAction('#ef4444', isUpdating), marginTop: '12px', backgroundColor: '#fee2e2', color: '#dc2626', boxShadow: 'none' }}
                                        >
                                            RECUSAR TODOS
                                        </button>
                                    </div>
                                </div>
                             );
                         }
                    })}
                </div>
            )}

            {/* --- MEUS PEDIDOS --- */}
            {groupedActive.length > 0 && (
                 <h4 style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Minhas Entregas em Andamento ({myDeliveries.length})
                 </h4>
            )}

            {groupedActive.map(item => {
                if (item.type === 'single') {
                    const order = item.data;
                    const { needsMachine, totalDist, totalTime } = getRouteInfo(order);
                    const { currentStep, btnText, btnColor, codeSource } = getStepInfo(order);
                    
                    const isMachineDone = order.step_status === 'machine_collected' || order.step_status === 'product_collected' || order.step_status === 'delivered';
                    const isStoreDone = order.step_status === 'product_collected' || order.step_status === 'delivered';
                    const isClientDone = order.step_status === 'delivered';
    
                    const machineStatus = currentStep === 'machine' ? 'active' : (isMachineDone ? 'completed' : 'pending');
                    const storeStatus = currentStep === 'store' ? 'active' : (isStoreDone ? 'completed' : 'pending');
                    const clientStatus = currentStep === 'client' ? 'active' : (isClientDone ? 'completed' : 'pending');
    
                    return (
                        <div key={order.id} style={styles.orderCard}>
                            {/* HEADER CARD */}
                            <div style={styles.cardHeader}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Pedido #{order.id}</span>
                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>R$ {Number(order.delivery_fee).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {totalTime} min
                                    </span>
                                    <span style={{ padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Navigation size={14} /> {totalDist.toFixed(1)} km
                                    </span>
                                </div>
                            </div>
    
                            <div style={styles.cardBody}>
                                {/* --- TIMELINE --- */}
                                <div style={styles.routeContainer}>
                                    
                                    {/* 1. MAQUININHA (Condicional) */}
                                    {needsMachine && (
                                        <div style={styles.routeStep(machineStatus)}>
                                            <div style={styles.stepIcon('#f59e0b', machineStatus === 'active' || machineStatus === 'completed')}>
                                                {machineStatus === 'completed' ? <CheckCircle size={20} /> : <CreditCard size={20}/>}
                                            </div>
                                            <div style={styles.stepLine(machineStatus === 'completed')} />
                                            <div style={styles.stepContent}>
                                                <div style={styles.stepTitle}>
                                                    RETIRAR MAQUININHA 
                                                    {machineStatus === 'active' && <span style={{color: '#f59e0b'}}>● Atual</span>}
                                                </div>
                                                <div style={styles.stepAddress}>{settings.central_address}</div>
                                                <button onClick={() => openNavigation(settings.central_address)} style={styles.btnGps}>
                                                    <Navigation size={12} /> Navegar
                                                </button>
                                            </div>
                                        </div>
                                    )}
    
                                    {/* 2. LOJA */}
                                    <div style={styles.routeStep(storeStatus)}>
                                        <div style={styles.stepIcon('#3b82f6', storeStatus === 'active' || storeStatus === 'completed')}>
                                            {storeStatus === 'completed' ? <CheckCircle size={20} /> : <Store size={20}/>}
                                        </div>
                                        <div style={styles.stepLine(storeStatus === 'completed')} />
                                        <div style={styles.stepContent}>
                                            <div style={styles.stepTitle}>
                                                COLETAR NA LOJA
                                                {storeStatus === 'active' && <span style={{color: '#3b82f6'}}>● Atual</span>}
                                            </div>
                                            <div style={styles.stepAddress}>
                                                {order.store_address || order.store?.address || 'Endereço da Loja'}
                                            </div>
                                            <button onClick={() => openNavigation(order.store_address || order.store?.address)} style={styles.btnGps}>
                                                <Navigation size={12} /> Navegar
                                            </button>
                                        </div>
                                    </div>
    
                                    {/* 3. CLIENTE */}
                                    <div style={{ ...styles.routeStep(clientStatus), marginBottom: 0 }}>
                                        <div style={styles.stepIcon('#22c55e', clientStatus === 'active' || clientStatus === 'completed')}>
                                            {clientStatus === 'completed' ? <CheckCircle size={20} /> : <User size={20}/>}
                                        </div>
                                        {/* Sem linha final */}
                                        <div style={styles.stepContent}>
                                            <div style={styles.stepTitle}>
                                                ENTREGAR AO CLIENTE
                                                {clientStatus === 'active' && <span style={{color: '#22c55e'}}>● Atual</span>}
                                            </div>
                                            <div style={styles.stepAddress}>{order.delivery_address}</div>
                                            {order.delivery_observation && (
                                                <div style={{ marginTop: '4px', marginBottom: '8px', padding: '6px', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '12px', color: '#9a3412', lineHeight: '1.4' }}>
                                                    <strong>Obs:</strong> {order.delivery_observation}
                                                </div>
                                            )}
                                            <button onClick={() => openNavigation(order.delivery_address)} style={styles.btnGps}>
                                                <Navigation size={12} /> Navegar
                                            </button>
                                        </div>
                                    </div>
                                </div>
    
                                {/* --- ACTION BUTTON --- */}
                                <button 
                                    onClick={() => openConfirmModal(order.id, btnText)}
                                    disabled={isUpdating}
                                    style={styles.btnAction(btnColor, isUpdating)}
                                >
                                    {isUpdating ? 'Processando...' : (
                                        <>
                                            {btnText} <ChevronRight size={20} />
                                        </>
                                    )}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                                    Solicite o código ao: <strong>{codeSource}</strong>
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    // --- BATCH ACTIVE CARD ---
                    const orders = item.data;
                    const { needsMachine, isMachineDone, storeGroups, allStoresDone, isDelivered, currentStep, activeStoreId } = getBatchStepInfo(orders);
                    const totalFee = orders.reduce((acc, o) => acc + Number(o.delivery_fee), 0);
                    
                    // First order for client info
                    const firstOrder = orders[0];

                    return (
                        <div key={`active-batch-${item.id}`} style={{ ...styles.orderCard, border: '2px solid #4338ca' }}>
                             <div style={{ ...styles.cardHeader, backgroundColor: '#e0e7ff' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4338ca', textTransform: 'uppercase' }}>PACOTE EM ANDAMENTO</span>
                                        <span style={{ fontSize: '10px', backgroundColor: '#4338ca', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: '700' }}>
                                            📦 BATCH
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>R$ {totalFee.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#4338ca', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Package size={14} /> {orders.length} itens
                                    </span>
                                </div>
                            </div>
                            
                            <div style={styles.cardBody}>
                                <div style={styles.routeContainer}>
                                     {/* 1. MAQUININHA */}
                                     {needsMachine && (
                                        <div style={styles.routeStep(isMachineDone ? 'completed' : 'active')}>
                                            <div style={styles.stepIcon('#f59e0b', currentStep === 'machine' || isMachineDone)}>
                                                {isMachineDone ? <CheckCircle size={20} /> : <CreditCard size={20}/>}
                                            </div>
                                            <div style={styles.stepLine(isMachineDone)} />
                                            <div style={styles.stepContent}>
                                                <div style={styles.stepTitle}>
                                                    RETIRAR MAQUININHA
                                                    {currentStep === 'machine' && <span style={{color: '#f59e0b'}}> ● Atual</span>}
                                                </div>
                                                <div style={styles.stepAddress}>{settings.central_address}</div>
                                                <button onClick={() => openNavigation(settings.central_address)} style={styles.btnGps}>
                                                    <Navigation size={12} /> Navegar
                                                </button>
                                                
                                                {currentStep === 'machine' && (
                                                    <button 
                                                        onClick={() => {
                                                            // Find any order needing machine to trigger batch update
                                                            const target = orders.find(o => ['credit_card','debit_card'].includes(o.payment_method));
                                                            if (target) openConfirmModal(target.id, 'Confirmar Retirada da Maquininha');
                                                        }}
                                                        disabled={isUpdating}
                                                        style={{ ...styles.btnAction('#f59e0b', isUpdating), marginTop: '12px', padding: '12px', fontSize: '14px' }}
                                                    >
                                                        Confirmar Retirada (Senha Admin)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                     )}

                                     {/* 2. LOJAS (Loop) */}
                                     {Object.entries(storeGroups).map(([storeId, group], idx) => {
                                         // Status calc
                                         const isThisStoreDone = group.status === 'completed';
                                         const isThisStoreActive = currentStep === 'store' && activeStoreId === storeId;
                                         
                                         return (
                                            <div key={storeId} style={styles.routeStep(isThisStoreDone ? 'completed' : (isThisStoreActive ? 'active' : 'pending'))}>
                                                <div style={styles.stepIcon('#3b82f6', isThisStoreActive || isThisStoreDone)}>
                                                    {isThisStoreDone ? <CheckCircle size={20} /> : <Store size={20}/>}
                                                </div>
                                                <div style={styles.stepLine(isThisStoreDone)} />
                                                <div style={styles.stepContent}>
                                                    <div style={styles.stepTitle}>
                                                        COLETAR: {group.storeName}
                                                        {isThisStoreActive && <span style={{color: '#3b82f6'}}> ● Atual</span>}
                                                    </div>
                                                    <div style={styles.stepAddress}>{group.storeAddress}</div>
                                                    <button onClick={() => openNavigation(group.storeAddress)} style={styles.btnGps}>
                                                        <Navigation size={12} /> Navegar
                                                    </button>

                                                    {isThisStoreActive && (
                                                        <div style={{marginTop: '12px'}}>
                                                            {group.orders.map(o => (
                                                                <button 
                                                                    key={o.id}
                                                                    onClick={() => openConfirmModal(o.id, `Confirmar Coleta: ${group.storeName}`)}
                                                                    disabled={isUpdating}
                                                                    style={{ ...styles.btnAction('#3b82f6', isUpdating), marginTop: '8px', padding: '12px', fontSize: '14px' }}
                                                                >
                                                                    Confirmar Pedido #{o.id}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                         );
                                     })}

                                     {/* 3. CLIENTE */}
                                     <div style={{ ...styles.routeStep(isDelivered ? 'completed' : (currentStep === 'client' ? 'active' : 'pending')), marginBottom: 0 }}>
                                         <div style={styles.stepIcon('#22c55e', isDelivered || currentStep === 'client')}>
                                             {isDelivered ? <CheckCircle size={20} /> : <User size={20}/>}
                                         </div>
                                         {/* No line */}
                                         <div style={styles.stepContent}>
                                             <div style={styles.stepTitle}>
                                                 ENTREGAR AO CLIENTE
                                                 {currentStep === 'client' && <span style={{color: '#22c55e'}}> ● Atual</span>}
                                             </div>
                                             <div style={styles.stepAddress}>{firstOrder.delivery_address}</div>
                                             {firstOrder.delivery_observation && (
                                                <div style={{ marginTop: '4px', marginBottom: '8px', padding: '6px', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '12px', color: '#9a3412', lineHeight: '1.4' }}>
                                                    <strong>Obs:</strong> {firstOrder.delivery_observation}
                                                </div>
                                             )}
                                             <button onClick={() => openNavigation(firstOrder.delivery_address)} style={styles.btnGps}>
                                                 <Navigation size={12} /> Navegar
                                             </button>
                                             
                                             {currentStep === 'client' && (
                                                <button 
                                                    onClick={() => openConfirmModal(firstOrder.id, 'Finalizar Entrega do Pacote')}
                                                    disabled={isUpdating}
                                                    style={{ ...styles.btnAction('#22c55e', isUpdating), marginTop: '12px', padding: '12px', fontSize: '14px' }}
                                                >
                                                    Finalizar Entrega (Código Cliente)
                                                </button>
                                             )}
                                         </div>
                                     </div>

                                </div>
                            </div>
                        </div>
                    );
                }
            })}

            {groupedActive.length === 0 && availableOrders.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '20px', opacity: 0.5 }}><Package size={64} style={{ margin: '0 auto' }} /></div>
                    <h3>Nenhum pedido ativo</h3>
                    <p>Aguarde novas notificações de entrega.</p>
                 </div>
            )}
        </>
      )}

      {!isLoading && activeSubTab === 'history' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <h3 style={{ marginBottom: '20px' }}>Histórico de Entregas</h3>
              {finishedOrders.length === 0 ? (
                  <p>Nenhuma entrega finalizada ainda.</p>
              ) : (
                  finishedOrders.map(order => (
                      <div key={order.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong>Pedido #{order.id}</strong>
                              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>R$ {Number(order.delivery_fee).toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>{new Date(order.created_at).toLocaleString()}</div>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
}