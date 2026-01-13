const channels = new Map(); // key (userId ou orderId) => Set(res)

function subscribe(key, res) {
  const id = String(key);
  if (!channels.has(id)) channels.set(id, new Set());
  
  const set = channels.get(id);
  set.add(res);

  // Limpeza automática ao fechar conexão
  res.on('close', () => {
    if (set.has(res)) {
      set.delete(res);
      if (set.size === 0) channels.delete(id);
    }
  });
}

// Renomeei de publishToUser para publish para ficar genérico (serve para OrderID ou UserID)
function publish(key, data) {
  const id = String(key);
  const set = channels.get(id);
  
  if (!set || set.size === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      console.error(`Erro ao enviar SSE para ${id}`, e);
    }
  }
}

module.exports = { subscribe, publish };