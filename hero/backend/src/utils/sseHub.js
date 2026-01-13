const channels = new Map(); // orderId => Set(res)

function subscribe(orderId, res) {
  const id = String(orderId); // Garante que é string para evitar duplicidade de tipos

  if (!channels.has(id)) {
    channels.set(id, new Set());
  }
  
  const set = channels.get(id);
  set.add(res);

  // Limpeza automática quando o cliente fecha a conexão
  res.on('close', () => {
    if (set.has(res)) {
      set.delete(res);
      if (set.size === 0) channels.delete(id);
    }
  });
}

function publish(orderId, data) {
  const id = String(orderId); // Garante compatibilidade (Int vs String)
  const set = channels.get(id);

  if (!set || set.size === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;

  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      // Se a conexão estiver quebrada, apenas ignora
      console.error(`Erro ao enviar SSE para pedido ${id}`, e);
    }
  }
}

module.exports = { subscribe, publish };