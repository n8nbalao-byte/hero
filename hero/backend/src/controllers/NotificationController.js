const jwt = require('jsonwebtoken');
const { subscribe } = require('../utils/notifyHub');

module.exports = {
  async stream(req, res) {
    try {
      let userId = req.userId;

      // Se não veio pelo middleware (Auth), tenta pegar da Query String (padrão do EventSource)
      if (!userId) {
        const token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.query.token;
        
        if (!token) {
          return res.status(401).end();
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (err) {
          return res.status(401).end();
        }
      }

      // Configura os headers para SSE (Keep-Alive)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Envia um "ping" inicial para confirmar conexão
      res.write('\n');

      // Registra o usuário no Hub de Notificações
      subscribe(userId, res);

      // Log para controle
      console.log(`📡 Usuário ${userId} conectado ao stream de notificações.`);

      // Remove do Hub quando o cliente fechar a aba/conexão
      req.on('close', () => {
        console.log(`📴 Usuário ${userId} desconectou.`);
        // A limpeza é feita automaticamente no notifyHub se configurado, 
        // ou podemos chamar uma função unsubscribe aqui se necessário.
      });

    } catch (error) {
      console.error('Erro no Stream SSE:', error);
      return res.status(500).end();
    }
  }
};