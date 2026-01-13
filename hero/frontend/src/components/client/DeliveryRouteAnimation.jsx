import React from 'react';
import { MapPin, Store, CreditCard, User, Truck, CheckCircle } from 'lucide-react';

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  timeline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    marginTop: '30px',
    marginBottom: '20px',
    padding: '0 10px'
  },
  lineBase: {
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '4px',
    backgroundColor: '#e2e8f0',
    zIndex: 1,
    transform: 'translateY(-50%)'
  },
  lineProgress: (progress) => ({
    position: 'absolute',
    top: '50%',
    left: '0',
    width: `${progress}%`,
    height: '4px',
    backgroundColor: '#22c55e',
    zIndex: 1,
    transform: 'translateY(-50%)',
    transition: 'width 1s ease-in-out'
  }),
  stepContainer: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '80px', // Fixed width for alignment
    textAlign: 'center'
  },
  stepCircle: (active, completed) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: completed ? '#22c55e' : (active ? '#fff' : '#e2e8f0'),
    border: `3px solid ${completed ? '#22c55e' : (active ? '#22c55e' : '#cbd5e1')}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: completed ? '#fff' : (active ? '#22c55e' : '#94a3b8'),
    transition: 'all 0.3s ease'
  }),
  stepLabel: (active, completed) => ({
    marginTop: '10px',
    fontSize: '12px',
    fontWeight: active || completed ? 'bold' : 'normal',
    color: active || completed ? '#1e293b' : '#94a3b8'
  }),
  courierIcon: (progress) => ({
    position: 'absolute',
    top: '-30px',
    left: `calc(${progress}% - 20px)`,
    transition: 'left 1s ease-in-out',
    zIndex: 3,
    color: '#DC0000',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  }),
  etaText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    marginTop: '15px',
    backgroundColor: '#f8fafc',
    padding: '8px',
    borderRadius: '8px'
  }
};

export default function DeliveryRouteAnimation({ order }) {
  // 1. Determinar se precisa passar na Central
  const needsMachine = ['credit_card', 'debit_card'].includes(order.payment_method);

  // 2. Definir os pontos da rota
  // steps: [ { id, label, icon } ]
  let steps = [];

  if (needsMachine) {
    steps.push({ id: 'machine', label: 'Central', icon: <CreditCard size={18} /> });
  }
  steps.push({ id: 'store', label: order.store?.nome || 'Loja', icon: <Store size={18} /> });
  steps.push({ id: 'client', label: 'Você', icon: <User size={18} /> });

  // 3. Calcular progresso baseando-se no status
  // Status backend: pending -> accepted -> (step_status: machine_collected) -> (step_status: product_collected) -> delivering -> delivered
  
  let currentStepIndex = 0;
  let progressPercent = 0;
  let statusText = 'Aguardando confirmação...';

  // Lógica de mapeamento de status
  if (order.status === 'pending') {
    currentStepIndex = 0;
    progressPercent = 0;
    statusText = order.payment_method === 'asaas' || order.payment_method === 'pix' 
      ? 'Aguardando pagamento / Confirmação da loja...' 
      : 'Aguardando restaurante aceitar...';
  } else if (order.status === 'accepted' || order.status === 'ready_for_pickup') {
    // Motoboy aceitou ou está indo
    if (needsMachine && order.step_status === 'pending') {
       currentStepIndex = 0;
       progressPercent = 10; // Iniciando
       statusText = 'Motoboy indo à Central buscar maquininha';
    } else if (needsMachine && order.step_status === 'machine_collected') {
       currentStepIndex = 1; // Já passou da central, indo pra loja
       progressPercent = 40; 
       statusText = 'Maquininha retirada. Indo para a loja.';
    } else if (!needsMachine && order.step_status === 'pending') {
       currentStepIndex = 0; // Indo pra loja (sem central)
       progressPercent = 20;
       statusText = 'Motoboy indo para a loja';
    } else if (order.step_status === 'product_collected') {
       currentStepIndex = steps.length - 1; // Indo pro cliente
       progressPercent = 75;
       statusText = 'Pedido coletado! Indo até você.';
    }
  } else if (order.status === 'delivering') {
    currentStepIndex = steps.length - 1;
    progressPercent = 85;
    statusText = 'Saiu para entrega!';
  } else if (order.status === 'delivered') {
    currentStepIndex = steps.length;
    progressPercent = 100;
    statusText = 'Pedido entregue!';
  }

  // Ajuste fino do percentual visual para a moto
  // Se temos 3 passos: 0% (start), 50% (middle), 100% (end)
  // Se temos 2 passos: 0% (start), 100% (end)
  const totalSegments = steps.length - 1;
  const segmentSize = 100 / totalSegments;
  
  // Recalcular percentual visual baseado no step atual exato para a bolinha
  // Mas queremos uma animação fluida, então mantemos o progressPercent estimado acima para a barra
  // E usamos o index para colorir as bolinhas

  return (
    <div style={styles.container}>
      <h3 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#334155'}}>
        Rastreamento do Pedido
      </h3>
      
      <div style={styles.timeline}>
        {/* Linha de Fundo */}
        <div style={styles.lineBase} />
        
        {/* Linha de Progresso */}
        <div style={styles.lineProgress(progressPercent)} />

        {/* Moto Animada */}
        <div style={styles.courierIcon(progressPercent)}>
          <Truck size={32} style={{transform: 'scaleX(-1)'}} /> 
          {/* scaleX(-1) para virar a moto pra direita se necessário, ou usar icon certo */}
        </div>

        {/* Passos */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || order.status === 'delivered';
          const isActive = index === currentStepIndex && order.status !== 'delivered';

          return (
            <div key={step.id} style={styles.stepContainer}>
              <div style={styles.stepCircle(isActive, isCompleted)}>
                {isCompleted ? <CheckCircle size={20} /> : step.icon}
              </div>
              <div style={styles.stepLabel(isActive, isCompleted)}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.etaText}>
        {statusText} • Previsão: {order.delivery_fee ? '15-30 min' : 'Calculando...'}
      </div>
    </div>
  );
}
