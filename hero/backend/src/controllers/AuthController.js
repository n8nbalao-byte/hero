const db = require('../database'); // Importa a conexão que configuramos
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');

// Função auxiliar para validar Token Google (Mantida, apenas limpeza)
function getTokenInfo(idToken) {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error('invalid_google_token'));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

module.exports = {
  // --- REGISTRO ---
  async register(req, res) {
    try {
      // Recebe dados em português do frontend
      const { nome, email, senha, telefone, tipo, veiculo_tipo, veiculo_placa, whatsapp, foto_perfil, cpf } = req.body;

      // 1. Verificar se usuário já existe
      const [existingUsers] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      // 2. Criptografar senha
      const password_hash = await bcrypt.hash(senha, 8);

      // 3. Inserir no MySQL
      const sql = `
        INSERT INTO usuarios 
        (nome, email, senha, telefone, tipo, veiculo_tipo, veiculo_placa, whatsapp, avatar_url, cpf) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        nome, 
        email, 
        password_hash, 
        telefone || null, 
        tipo || 'client', 
        veiculo_tipo || null, 
        veiculo_placa || null, 
        whatsapp || null, 
        foto_perfil || null,
        cpf || null
      ];

      const [result] = await db.query(sql, values);

      // 4. Retornar dados
      return res.json({
        id: result.insertId,
        nome,
        email,
        tipo: tipo || 'client',
        cpf: cpf || null
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Falha no registro' });
    }
  },

  // --- LOGIN ---
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // 1. Buscar usuário pelo email
      const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      
      // Verifica se encontrou alguém
      if (users.length === 0) {
        return res.status(400).json({ error: 'Usuário não encontrado' });
      }

      const user = users[0];

      // 2. Verificar senha
      if (!(await bcrypt.compare(senha, user.senha))) {
        return res.status(400).json({ error: 'Senha inválida' });
      }

      // 3. Gerar Token
      const token = jwt.sign({ id: user.id, role: user.tipo }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      // Remove senha do objeto de retorno
      delete user.senha;

      return res.json({ user, token });

    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Falha no login' });
    }
  },

  // --- LOGIN GOOGLE ---
  async googleLogin(req, res) {
    try {
      const { id_token, role: requestedRole } = req.body;
      if (!id_token) {
        return res.status(400).json({ error: 'Token Google ausente' });
      }

      // Valida token no Google
      const data = await getTokenInfo(id_token);
      
      // Validação de segurança opcional (Audience)
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId && data.aud !== clientId) {
        return res.status(401).json({ error: 'Público inválido' });
      }

      const email = data.email;
      const name = data.name || email;
      const googleId = data.sub; // ID único do Google
      const avatar = data.picture;

      if (!email) {
        return res.status(400).json({ error: 'Token Google sem email' });
      }

      // 1. Verifica se usuário existe
      const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      let user = users[0];

      // 2. Se não existir, cria
      if (!user) {
        // Se veio role no body, usa. Senão, padrão é client.
        const role = requestedRole || 'client'; 

        const [result] = await db.query(`
          INSERT INTO usuarios (nome, email, senha, tipo, google_id, avatar_url)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [name, email, '', role, googleId, avatar]);

        user = {
          id: result.insertId,
          nome: name,
          email,
          tipo: role,
          avatar_url: avatar
        };
      } else {
        // Se existir, ATUALIZA o avatar se vier do Google (para manter sync)
        // Opcional: só atualizar se avatar_url for nulo ou se quisermos forçar.
        // O usuário pediu "esta imagem tbm pode ser obtida do google", então vamos atualizar.
        if (avatar) {
             await db.query('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [avatar, user.id]);
             user.avatar_url = avatar; // Atualiza objeto local
        }
      }

      // 3. Gera Token
      const token = jwt.sign({ id: user.id, role: user.tipo }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      delete user.senha;
      return res.json({ user, token });

    } catch (error) {
      console.error('Erro no Google Login:', error);
      return res.status(500).json({ error: 'Falha no login com Google' });
    }
  }
};
