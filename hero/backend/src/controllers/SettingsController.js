const db = require('../database');

module.exports = {
  // Obter todas as configurações
  async index(req, res) {
    try {
      const [rows] = await db.query('SELECT chave, valor FROM configuracoes');
      
      // Transformar em objeto { key: value }
      const settings = rows.reduce((acc, row) => {
        acc[row.chave] = row.valor;
        return acc;
      }, {});

      return res.json(settings);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  },

  // Atualizar configurações (upsert)
  async update(req, res) {
    const settings = req.body; // Espera objeto { key: value, ... }

    try {
      // Para cada chave enviada, faz upsert
      const promises = Object.entries(settings).map(([key, value]) => {
        return db.query(`
          INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
          ON DUPLICATE KEY UPDATE valor = VALUES(valor)
        `, [key, value]);
      });

      await Promise.all(promises);

      return res.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  }
};
