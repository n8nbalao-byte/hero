import React, { useState } from 'react';
import api from '../../services/api';
import { Truck, CheckCircle, Clock, XCircle, Info } from 'lucide-react';

export default function OrdersTab({ orders, onRefresh }) {
  const [processing, setProcessing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // Modal State

  const statusTranslations = {
    pending: 'Pendente',
    accepted: 'Em Preparação',
    ready_for_pickup: 'Aguardando Coleta',
    delivering: 'Saiu para Entrega',
    delivered: 'Entregue',
    canceled: 'Cancelado'
  };

  const handleUpdateStatus = async (id, status) => {
    const statusText = statusTranslations[status] || status;
    if (!confirm(`Confirmar alteração para: ${statusText}?`)) return;
    setProcessing(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      onRefresh();
    } catch (e) {
      alert('Erro ao atualizar status');
    } finally {
      setProcessing(null);
      setSelectedOrder(null); // Fecha modal se estiver aberto
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* MODAL DE DETALHES */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-800">Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24}/></button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase">Cliente</h3>
                <p className="text-lg font-medium">{selectedOrder.client_name || 'Cliente'}</p>
                <p className="text-sm text-slate-600">{selectedOrder.delivery_address}</p>
                {(selectedOrder.client_phone || selectedOrder.client_whatsapp) && (
                   <p className="text-sm text-slate-600 mt-1">
                      📞 {selectedOrder.client_phone || selectedOrder.client_whatsapp}
                   </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase">Itens</h3>
                <ul className="divide-y">
                   {selectedOrder.items ? selectedOrder.items.map((item, idx) => (
                      <li key={idx} className="py-2 flex justify-between">
                        <span>{item.quantidade}x {item.product?.nome || 'Produto'}</span>
                        <span className="font-bold">R$ {(Number(item.preco_momento) * (item.quantidade || 1)).toFixed(2)}</span>
                      </li>
                   )) : <p className="text-sm text-gray-400 italic">Detalhes dos itens não carregados na lista.</p>}
                </ul>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>R$ {(Number(selectedOrder.total_amount) - Number(selectedOrder.delivery_fee || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Taxa de Entrega</span>
                    <span>R$ {Number(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-green-600">R$ {Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                <strong>Pagamento:</strong> {selectedOrder.payment_method === 'cash' ? 'Dinheiro' : 'Cartão / Online'}
              </div>

              {selectedOrder.store_pickup_code && (
                <div className="bg-purple-50 p-3 rounded text-sm text-purple-800 mt-2 border border-purple-100 text-center">
                    <div className="font-bold mb-1">🔐 Código de Coleta (Para Motoboy)</div>
                    <div className="text-2xl font-mono tracking-widest bg-white inline-block px-3 py-1 rounded border border-purple-200 font-bold text-purple-700">
                    {selectedOrder.store_pickup_code}
                    </div>
                    <p className="text-xs mt-1 text-purple-600">Informe este código ao entregador para liberar o pedido.</p>
                </div>
              )}

              {selectedOrder.courier && (
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mt-2 border border-blue-100">
                  <div className="font-bold mb-1 flex items-center gap-2">
                     <Truck size={16}/> Entregador Responsável
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedOrder.courier.avatar_url && (
                        <img src={selectedOrder.courier.avatar_url} className="w-8 h-8 rounded-full" alt="Avatar"/>
                    )}
                    <div>
                        <div className="font-bold">{selectedOrder.courier.nome}</div>
                        <div className="text-xs">{selectedOrder.courier.veiculo_tipo || 'Veículo'} • {selectedOrder.courier.veiculo_placa || 'Placa'}</div>
                        <div className="text-xs mt-1">📞 {selectedOrder.courier.telefone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2 justify-end">
               {selectedOrder.status === 'pending' && selectedOrder.payment_method !== 'asaas' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700"
                  >
                    Aceitar Pedido
                  </button>
               )}
               {selectedOrder.status === 'pending' && selectedOrder.payment_method === 'asaas' && (
                   <div className="text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-2 rounded flex items-center gap-2">
                       <Clock size={16}/> Aguardando Pagamento do Cliente
                   </div>
               )}
               <button onClick={() => setSelectedOrder(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300">
                 Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Truck size={18}/> Gerenciar Pedidos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3">#ID</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Ações</th>
              <th className="px-6 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Nenhum pedido recebido ainda.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="bg-white border-b hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold">
                    <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:underline">#{order.id}</button>
                  </td>
                  <td className="px-6 py-4">{order.client_name || 'Cliente'}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">R$ {Number(order.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'canceled' ? 'bg-red-100 text-red-700' : 
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {statusTranslations[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {processing === order.id ? (
                      <span className="text-gray-400">Processando...</span>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="text-gray-500 hover:text-blue-600" title="Ver Detalhes">
                            <Info size={18} />
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'accepted')} 
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                            >
                              <CheckCircle size={14} /> Aceitar
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'canceled')} 
                              className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1"
                            >
                              <XCircle size={14} /> Recusar
                            </button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} 
                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <Truck size={14} /> Pronto
                          </button>
                        )}
                        {order.status === 'ready_for_pickup' && (
                          <span className="text-xs text-gray-400 italic">Aguardando entregador...</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} <br/>
                    {new Date(order.created_at).toLocaleTimeString().slice(0,5)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
