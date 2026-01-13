export const translateStatus = (status) => {
  const map = {
    'pending': 'Pendente',
    'preparing': 'Em Preparo',
    'ready_pickup': 'Pronto para Coleta',
    'out_for_delivery': 'Saiu para Entrega',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'accepted': 'Aceito',
    'rejected': 'Rejeitado'
  };
  return map[status] || status;
};

export const translateStep = (step) => {
  const map = {
    'pending': 'Pendente',
    'machine': 'Retirar Maquininha',
    'store': 'Coletar Produto',
    'client': 'Entregar ao Cliente',
    'machine_collected': 'Maquininha Coletada',
    'product_collected': 'Produto Coletado',
    'finished': 'Finalizado'
  };
  return map[step] || step;
};
