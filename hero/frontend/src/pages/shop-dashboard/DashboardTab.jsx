import React from 'react';

export default function DashboardTab({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase">Faturamento</p>
        <h3 className="text-3xl font-bold mt-2">R$ {stats.revenue.toFixed(2)}</h3>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase">Pedidos</p>
        <h3 className="text-3xl font-bold mt-2">{stats.pending}</h3>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase">Produtos</p>
        <h3 className="text-3xl font-bold mt-2">{stats.totalProducts}</h3>
      </div>
    </div>
  );
}
