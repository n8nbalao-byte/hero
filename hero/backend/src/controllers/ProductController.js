const db = require('../database');

module.exports = {
  // LISTAR CATEGORIAS ÚNICAS
  async getCategories(req, res) {
    try {
      const [rows] = await db.query('SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND categoria != "" ORDER BY categoria ASC');
      const categories = rows.map(r => r.categoria);
      return res.json(categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  },

  // LISTAR TODOS OS PRODUTOS (Feed Global)
  async listAll(req, res) {
    try {
      // Busca produtos aleatórios ou os mais recentes
      const [products] = await db.query('SELECT * FROM produtos ORDER BY id DESC LIMIT 50');
      return res.json(products);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  },

  // LISTAR PRODUTOS DA LOJA
  async index(req, res) {
    try {
      const { store_id } = req.params;
      const [products] = await db.query('SELECT * FROM produtos WHERE loja_id = ?', [store_id]);
      return res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  },

  // DETALHES DO PRODUTO
  async show(req, res) {
    try {
      const { id } = req.params;
      const [products] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
      if (products.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.json(products[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // CRIAR UM ÚNICO PRODUTO
  async store(req, res) {
    try {
      const { store_id } = req.params;
      const { name, description, price, category, imageUrl, stock, supplier, original_link } = req.body;
      const userId = req.userId;

      // Map params to pt
      const nome = name || req.body.nome;
      const descricao = description || req.body.descricao || '';
      const preco = price || req.body.preco;
      const categoria = category || req.body.categoria || '';
      const imagem_url = imageUrl || req.body.imagem_url || '';
      const estoque = stock || req.body.estoque || 0;
      const fornecedor = supplier || req.body.fornecedor || '';
      const link_original = original_link || req.body.link_original || '';

      // 1. Verifica dono da loja
      const [stores] = await db.query('SELECT usuario_id FROM lojas WHERE id = ?', [store_id]);
      if (stores.length === 0 || stores[0].usuario_id !== userId) {
        return res.status(403).json({ error: 'Não autorizado' });
      }

      // 2. Insere
      const [result] = await db.query(`
        INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, imagem_url, estoque, fornecedor, link_original)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [store_id, nome, descricao, preco, categoria, imagem_url, estoque, fornecedor, link_original]);

      return res.json({ id: result.insertId, ...req.body });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },

  // --- CADASTRO EM MASSA (IMPORTAÇÃO COM DEBUG) ---
  async storeBulk(req, res) {
    console.log('--- 🟢 INICIANDO BULK IMPORT ---'); // LOG 1
    try {
      const { store_id } = req.params;
      const products = req.body; 
      const userId = req.userId;

      console.log(`📦 Recebidos ${products.length} produtos para a loja ${store_id}`); // LOG 2

      if (!Array.isArray(products)) {
        console.error('❌ Erro: O corpo da requisição não é um array.');
        return res.status(400).json({ error: 'Envie uma lista (array) de produtos.' });
      }

      // 1. Verifica dono da loja
      const [stores] = await db.query('SELECT usuario_id FROM lojas WHERE id = ?', [store_id]);
      if (stores.length === 0 || stores[0].usuario_id !== userId) {
        console.error('❌ Erro: Usuário tentando salvar em loja alheia.');
        return res.status(403).json({ error: 'Não autorizado' });
      }

      // 2. Prepara valores (Limpeza de Dados)
      const values = products.map(p => {
        // Limpeza do nome (Remove aspas se vier "Notebook...")
        const rawName = p.name || p.nome;
        const cleanName = rawName ? rawName.replace(/^"|"$/g, '').trim() : 'Produto Sem Nome';
        
        // Verifica tamanho da imagem para log
        const img = p.imageUrl || p.imagem_url;
        if (img && img.length > 1000) {
            // console.log(`📸 Imagem Base64 detectada em: ${cleanName.substring(0, 20)}...`);
        }

        return [
          store_id,
          cleanName,
          p.description || p.descricao || '',
          p.price || p.preco || 0,
          p.category || p.categoria || 'Importados',
          p.imageUrl || p.imagem_url || '',
          p.stock || p.estoque || 10,
          p.supplier || p.fornecedor || 'Importado',
          p.original_link || p.link_original || ''
        ];
      });

      if (values.length === 0) return res.json({ message: 'Nenhum produto válido para importar.' });

      console.log('⏳ Executando INSERT no MySQL...'); // LOG 3
      
      const sql = `INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, imagem_url, estoque, fornecedor, link_original) VALUES ?`;
      
      const [result] = await db.query(sql, [values]);

      console.log(`✅ SUCESSO! ${result.affectedRows} linhas inseridas no banco.`); // LOG 4

      return res.json({ message: 'Sucesso', count: result.affectedRows });

    } catch (error) {
      console.error('❌ ERRO CRÍTICO NO BULK IMPORT:', error.message); // LOG DE ERRO REAL
      
      // Tratamento específico para erro de pacote grande (Base64)
      if (error.code === 'ER_NET_PACKET_TOO_LARGE') {
        console.error('⚠️ O pacote de dados excedeu o limite do MySQL (max_allowed_packet).');
        return res.status(413).json({ error: 'As imagens são muito pesadas para enviar de uma vez. Tente importar em lotes menores (ex: 5 produtos por vez).' });
      }

      return res.status(500).json({ error: 'Erro interno ao salvar produtos: ' + error.message });
    }
  },

  // ATUALIZAR PRODUTO
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category, imageUrl, stock, supplier, original_link } = req.body;
      
      const nome = name || req.body.nome;
      const descricao = description || req.body.descricao;
      const preco = price || req.body.preco;
      const categoria = category || req.body.categoria;
      const imagem_url = imageUrl || req.body.imagem_url;
      const estoque = stock || req.body.estoque;
      const fornecedor = supplier || req.body.fornecedor;
      const link_original = original_link || req.body.link_original;

      await db.query(`
        UPDATE produtos SET nome=?, descricao=?, preco=?, categoria=?, imagem_url=?, estoque=?, fornecedor=?, link_original=?
        WHERE id=?
      `, [nome, descricao, preco, categoria, imagem_url, estoque, fornecedor, link_original, id]);

      return res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  // DELETAR PRODUTO
  async delete(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM produtos WHERE id = ?', [id]);
      return res.json({ message: 'Produto deletado com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar produto' });
    }
  }
};
