const db = require('../database');
const sse = require('../utils/sseHub');
// const logger = require('../utils/logger'); // Se tiver o arquivo, descomente
const logger = { info: console.log, error: console.error };

module.exports = {
  async updateLocation(req, res) {
    const { latitude, longitude } = req.body;
    const userId = req.userId; // Vem do middleware auth

    try {
      // 1. Verificar se usuário existe e pegar a Role (tipo)
      // Precisamos do tipo para saber se é courier
      const [users] = await db.query('SELECT id, tipo FROM usuarios WHERE id = ?', [userId]);
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      const user = users[0];

      // 2. Atualizar Localização no Banco
      await db.query(
        'UPDATE usuarios SET latitude_atual = ?, longitude_atual = ? WHERE id = ?',
        [latitude, longitude, userId]
      );

      // 3. Se for Motoboy, avisa os pedidos em andamento (Broadcast)
      if (user.tipo === 'courier') {
        // Busca pedidos que este motoboy está entregando agora
        const [orders] = await db.query(
          'SELECT id FROM pedidos WHERE motoboy_id = ? AND status = "delivering"',
          [userId]
        );

        // Envia atualização via SSE para cada pedido
        for (const order of orders) {
          sse.publish(order.id, { 
            latitude, 
            longitude, 
            ts: Date.now() 
          });
        }

        if (orders.length > 0) {
          logger.info('courier.location.broadcast', { 
            userId, 
            orders: orders.map(o => o.id), 
            latitude, 
            longitude 
          });
        }
      }

      return res.json({ message: 'Localização atualizada', latitude, longitude });
      
    } catch (error) {
      logger.error('Erro updateLocation:', error);
      return res.status(500).json({ error: 'Erro ao atualizar localização' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { email, phone, whatsapp, cnh_url, document_url, name, birth_date, avatar_url, cpf } = req.body;
      const userId = req.userId;
      
      // Construir query dinamicamente
      const fields = [];
      const values = [];
      
      if (email !== undefined) { fields.push('email = ?'); values.push(email); }
      if (phone !== undefined) { fields.push('telefone = ?'); values.push(phone); }
      if (whatsapp !== undefined) { fields.push('whatsapp = ?'); values.push(whatsapp); }
      if (cnh_url !== undefined) { fields.push('cnh_url = ?'); values.push(cnh_url); }
      if (document_url !== undefined) { fields.push('document_url = ?'); values.push(document_url); }
      if (name !== undefined) { fields.push('nome = ?'); values.push(name); }
      if (birth_date !== undefined) { fields.push('data_nascimento = ?'); values.push(birth_date); }
      if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }
      if (cpf !== undefined) { fields.push('cpf = ?'); values.push(cpf); }

      if (fields.length === 0) return res.json({ message: 'Nada para atualizar' });

      values.push(userId);
      const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;

      await db.query(sql, values);
      return res.json({ message: 'Perfil atualizado' });
    } catch (e) { 
        console.error(e);
        return res.status(500).json({ error: 'Falha ao atualizar perfil' }); 
    }
  },

  // === VEHICLES CRUD (Veículos do Usuário) ===
  async getVehicles(req, res) {
    try {
        const userId = req.userId;
        const [vehicles] = await db.query('SELECT * FROM veiculos_usuario WHERE usuario_id = ? ORDER BY criado_em DESC', [userId]);
        
        // Mapear de volta para o frontend se necessário, ou usar nomes em pt
        // O frontend provavelmente espera type, plate, model. Vamos manter compatibilidade de resposta se possível, ou mudar frontend.
        // O user pediu TUDO em portugues. Então vou retornar em pt, mas tenho que garantir que frontend entenda.
        // Vou retornar as colunas do banco (tipo, placa, modelo).
        return res.json(vehicles);
    } catch (e) { return res.status(500).json({ error: 'Falha ao buscar veículos' }); }
  },

  async addVehicle(req, res) {
    try {
        const { type, plate, model } = req.body; // Frontend manda type, plate, model? Ou tipo, placa, modelo?
        // Assumindo que frontend ainda manda ingles, mas vou mapear. Se frontend mudou, ajusto.
        // O user disse "coloque todo o site em portugues". Vou assumir que o frontend vai ser ajustado ou já foi.
        // Mas para garantir, vou aceitar ambos.
        
        const tipo = type || req.body.tipo;
        const placa = plate || req.body.placa;
        const modelo = model || req.body.modelo;

        const userId = req.userId;
        const [result] = await db.query(
            'INSERT INTO veiculos_usuario (usuario_id, tipo, placa, modelo) VALUES (?, ?, ?, ?)',
            [userId, tipo, placa, modelo]
        );
        return res.json({ id: result.insertId, tipo, placa, modelo });
    } catch (e) { return res.status(500).json({ error: 'Falha ao adicionar veículo' }); }
  },

  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const { type, plate, model } = req.body;
      
      const tipo = type || req.body.tipo;
      const placa = plate || req.body.placa;
      const modelo = model || req.body.modelo;
      
      const userId = req.userId;
      
      await db.query(
        'UPDATE veiculos_usuario SET tipo = ?, placa = ?, modelo = ? WHERE id = ? AND usuario_id = ?',
        [tipo, placa, modelo, id, userId]
      );
      return res.json({ message: 'Veículo atualizado' });
    } catch (e) { return res.status(500).json({ error: 'Falha ao atualizar veículo' }); }
  },

  async deleteVehicle(req, res) {
    try {
        const { id } = req.params;
        const userId = req.userId;
        await db.query('DELETE FROM veiculos_usuario WHERE id = ? AND usuario_id = ?', [id, userId]);
        return res.json({ message: 'Veículo deletado' });
    } catch (e) { return res.status(500).json({ error: 'Falha ao deletar veículo' }); }
  },


  async requestWithdraw(req, res) {
    try {
        const { amount } = req.body;
        const userId = req.userId;
        const notify = require('../utils/notifyHub');
        const whatsapp = require('../services/whatsapp');

        // Notificar Admin Master
        const [admins] = await db.query("SELECT id, telefone, whatsapp FROM usuarios WHERE tipo = 'admin'");
        
        admins.forEach(admin => {
            notify.send(admin.id, {
                type: 'withdraw_request',
                title: 'Solicitação de Saque 💰',
                body: `O entregador #${userId} solicitou saque de R$ ${Number(amount).toFixed(2)}`
            });

            const phone = admin.whatsapp || admin.telefone;
            if (phone) {
                whatsapp.sendText(phone, `💰 Nova solicitação de saque!\nEntregador ID: ${userId}\nValor: R$ ${Number(amount).toFixed(2)}`);
            }
        });

        return res.json({ message: 'Solicitação de saque enviada' });
    } catch (e) { 
        console.error(e);
        return res.status(500).json({ error: 'Falha ao solicitar saque' }); 
    }
  }
};
