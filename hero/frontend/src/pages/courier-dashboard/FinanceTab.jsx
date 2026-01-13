import React, { useState } from 'react';
import { FaWallet, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../services/api';

const styles = {
  container: { padding: '20px' },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center'
  },
  value: { fontSize: '32px', fontWeight: 'bold', color: '#28a745', margin: '10px 0' },
  withdrawBtn: {
    backgroundColor: '#DC0000', color: '#fff', border: 'none', padding: '12px 30px',
    borderRadius: '25px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
    marginTop: '15px', boxShadow: '0 4px 10px rgba(220,0,0,0.2)'
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '15px', textAlign: 'left', borderBottom: '2px solid #eee', color: '#666', fontSize: '14px' },
  td: { padding: '15px', borderBottom: '1px solid #eee', fontSize: '14px' }
};

export default function FinanceTab({ finishedOrders, totalEarnings, user }) {
  const [requesting, setRequesting] = useState(false);

  const handleWithdrawRequest = async () => {
    if (totalEarnings < 50) {
      alert('O valor mínimo para saque é R$ 50,00');
      return;
    }
    
    if (!confirm(`Confirmar solicitação de saque no valor de R$ ${totalEarnings.toFixed(2)}?`)) return;

    setRequesting(true);
    try {
      // Endpoint real para solicitação de saque
      await api.post('/withdrawals', { amount: totalEarnings });
      alert('Solicitação enviada com sucesso! O pagamento será processado em até 24h.');
    } catch (error) {
      alert('Erro ao solicitar saque. Tente novamente.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* SALDO CARD */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#666' }}>
          <FaWallet /> <span>Saldo Disponível</span>
        </div>
        <div style={styles.value}>R$ {totalEarnings.toFixed(2)}</div>
        <div style={{ fontSize: '13px', color: '#999' }}>Chave PIX: {user?.phone || 'Não cadastrada'}</div>
        
        <button 
          style={{ ...styles.withdrawBtn, opacity: requesting ? 0.7 : 1 }} 
          onClick={handleWithdrawRequest}
          disabled={requesting}
        >
          {requesting ? 'Processando...' : 'Solicitar Saque'}
        </button>
      </div>

      {/* HISTÓRICO */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
        <FaHistory /> Histórico de Entregas
      </h3>

      {finishedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Nenhuma entrega finalizada ainda.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Loja</th>
                <th style={styles.th}>Pedido</th>
                <th style={styles.th}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {finishedOrders.map(order => (
                <tr key={order.id}>
                  <td style={styles.td}>{new Date(order.atualizado_em || order.criado_em).toLocaleDateString()}</td>
                  <td style={styles.td}>{order.store?.nome}</td>
                  <td style={styles.td}>#{order.id}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#28a745' }}>
                    + R$ {Number(order.taxa_entrega).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}