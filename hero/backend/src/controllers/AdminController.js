const db = require('../database');

module.exports = {
  async getStats(req, res) {
    try {
      // 1. Totais Gerais
      // 'role' agora é 'tipo' na tabela 'usuarios'
      const [users] = await db.query('SELECT tipo as role, COUNT(*) as count FROM usuarios GROUP BY tipo');
      const [stores] = await db.query('SELECT COUNT(*) as count FROM lojas');
      // 'orders' agora é 'pedidos', 'total_amount' é 'valor_total'
      const [orders] = await db.query('SELECT COUNT(*) as count, SUM(valor_total) as revenue FROM pedidos WHERE status = "delivered"');
      
      const stats = {
        users: {
          client: 0,
          courier: 0,
          shop_owner: 0,
          admin: 0
        },
        stores: stores[0]?.count || 0,
        orders: {
          count: orders[0]?.count || 0,
          revenue: orders[0]?.revenue || 0
        }
      };

      users.forEach(u => {
        if (stats.users[u.role] !== undefined) {
          stats.users[u.role] = u.count;
        }
      });

      return res.json({ stats });
    } catch (error) {
      console.error("Erro no Admin Dashboard:", error);
      return res.status(500).json({ error: 'Erro ao carregar dados do admin' });
    }
  },

  // --- LOG DE ATIVIDADES ---
  async getLogs(req, res) {
    try {
      // Vamos agregar logs de várias tabelas para simular um "Activity Log"
      // 1. Novos Pedidos
      const [orders] = await db.query(`
        SELECT p.id, p.criado_em, 'pedido' as type, 
        CONCAT('Novo pedido #', p.id, ' na loja ', l.nome, ' - ', u.nome) as message
        FROM pedidos p
        JOIN lojas l ON p.loja_id = l.id
        JOIN usuarios u ON p.cliente_id = u.id
        ORDER BY p.criado_em DESC LIMIT 20
      `);

      // 2. Novos Usuários
      const [users] = await db.query(`
        SELECT id, criado_em, 'usuario' as type,
        CONCAT('Novo usuário cadastrado: ', nome, ' (', tipo, ')') as message
        FROM usuarios
        ORDER BY criado_em DESC LIMIT 20
      `);

      // 3. Novas Lojas
      const [stores] = await db.query(`
        SELECT id, criado_em as criado_em, 'loja' as type,
        CONCAT('Nova loja cadastrada: ', nome) as message
        FROM lojas
        ORDER BY criado_em DESC LIMIT 10
      `);

      // Unir e ordenar
      const allLogs = [...orders, ...users, ...stores]
        .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
        .slice(0, 50); // Pegar os 50 mais recentes

      return res.json(allLogs);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      return res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  },

  // --- LOJAS ---
  async getStores(req, res) {
    try {
      const [stores] = await db.query(`
        SELECT s.*, u.email as owner_email, u.nome as owner_name 
        FROM lojas s 
        JOIN usuarios u ON s.usuario_id = u.id 
        ORDER BY s.id DESC
      `);
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar lojas' });
    }
  },

  async getStoreDetails(req, res) {
    try {
      const { id } = req.params;
      const [store] = await db.query('SELECT * FROM lojas WHERE id = ?', [id]);
      if (store.length === 0) return res.status(404).json({ error: 'Loja não encontrada' });

      const [products] = await db.query('SELECT * FROM produtos WHERE loja_id = ?', [id]);
      
      return res.json({ store: store[0], products });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar detalhes da loja' });
    }
  },

  // --- ENTREGADORES ---
  async getCouriers(req, res) {
    try {
      const [couriers] = await db.query(`
        SELECT id, nome, email, telefone, online as is_online, criado_em, veiculo_tipo, veiculo_placa, avatar_url
        FROM usuarios 
        WHERE tipo = 'courier' 
        ORDER BY criado_em DESC
      `);
      return res.json(couriers);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar entregadores' });
    }
  },

  async getCourierDetails(req, res) {
    try {
      const { id } = req.params;
      const [courier] = await db.query('SELECT id, nome, email, telefone, online, criado_em, veiculo_tipo, veiculo_placa, avatar_url FROM usuarios WHERE id = ? AND tipo = "courier"', [id]);
      
      if (courier.length === 0) return res.status(404).json({ error: 'Entregador não encontrado' });

      // Total de entregas
      const [deliveries] = await db.query('SELECT COUNT(*) as total FROM pedidos WHERE motoboy_id = ? AND status = "delivered"', [id]);

      return res.json({ ...courier[0], total_entregas: deliveries[0].total });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar detalhes do entregador' });
    }
  },

  // --- CLIENTES ---
  async getClients(req, res) {
    try {
      const [clients] = await db.query(`
        SELECT id, nome, email, telefone, criado_em 
        FROM usuarios 
        WHERE tipo = 'client' 
        ORDER BY criado_em DESC
      `);
      return res.json(clients);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  async getClientDetails(req, res) {
    try {
      const { id } = req.params;
      const [client] = await db.query('SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = ? AND tipo = "client"', [id]);
      
      if (client.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });

      // Últimos pedidos
      const [orders] = await db.query('SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY criado_em DESC LIMIT 10', [id]);

      return res.json({ client: client[0], recent_orders: orders });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar detalhes do cliente' });
    }
  }
};
