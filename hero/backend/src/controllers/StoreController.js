const db = require('../database');

module.exports = {
  // LISTAR TODAS AS LOJAS (Público)
  async index(req, res) {
    try {
      const [stores] = await db.query('SELECT id, nome, categoria, imagem_url, status_loja FROM lojas');
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar lojas' });
    }
  },

  // DETALHES DE UMA LOJA (Público)
  async show(req, res) {
    try {
      const { id } = req.params;
      const [store] = await db.query('SELECT * FROM lojas WHERE id = ?', [id]);
      
      if (store.length === 0) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      // Remove dados sensíveis para o público (ex: chave API, dados bancários)
      const publicData = { ...store[0] };
      delete publicData.openai_key;
      delete publicData.banco_codigo;
      delete publicData.agencia;
      delete publicData.conta;
      delete publicData.cpf_responsavel;
      delete publicData.email_financeiro;

      // Mapear para frontend (se frontend esperar camelCase)
      // Mas o user pediu TUDO em portugues. Vou mandar como está no banco (snake_case pt).
      // Frontend deve se adaptar ou já estar adaptado.
      // Nota: StoreDetails.jsx usa `store.nome`, `store.imagem_url`? 
      // Vou checar StoreDetails.jsx depois, mas agora o foco é backend pt.

      return res.json(publicData);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar loja' });
    }
  },

  // DADOS DA MINHA LOJA (Painel do Lojista - Retorna TUDO)
  async myStore(req, res) {
    try {
      const userId = req.userId;
      const [store] = await db.query('SELECT * FROM lojas WHERE usuario_id = ?', [userId]);
      
      if (store.length === 0) {
        return res.status(404).json({ error: 'Você ainda não possui uma loja.' });
      }
      return res.json(store[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar dados da sua loja' });
    }
  },

  // CRIAR LOJA (Inicial)
  async store(req, res) {
    try {
      const { 
        name, phone, description, category, imageUrl, opening_hours,
        address, cep, logradouro, numero, complemento, bairro, cidade, uf,
        latitude, longitude 
      } = req.body;
      const userId = req.userId;

      // Verifica se já tem loja
      const [existing] = await db.query('SELECT id FROM lojas WHERE usuario_id = ?', [userId]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Você já possui uma loja cadastrada.' });
      }

      // Se veio address mas não os campos separados, tenta usar address como logradouro ou endereco
      // Mas o ideal é o frontend mandar tudo separado.
      const enderecoFinal = address || logradouro;

      const [result] = await db.query(`
        INSERT INTO lojas (
          usuario_id, nome, telefone, descricao, categoria, imagem_url, horarios_funcionamento,
          endereco, cep, logradouro, numero, complemento, bairro, cidade, uf,
          latitude, longitude
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, name, phone, description, category, imageUrl, opening_hours,
        enderecoFinal, cep, logradouro, numero, complemento, bairro, cidade, uf,
        latitude, longitude
      ]);

      return res.json({ id: result.insertId, message: 'Loja criada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar loja' });
    }
  },

  // ATUALIZAR CONFIGURAÇÕES DA LOJA (O "Monstro" que salva tudo)
  async update(req, res) {
    try {
      const userId = req.userId;
      const data = req.body;

      console.log('--- 📝 TENTATIVA DE ATUALIZAR LOJA ---');
      // console.log('Dados:', data); // Descomente se quiser ver tudo no log

      // Query gigante para atualizar todos os campos possíveis
      const sql = `
        UPDATE lojas SET 
          -- Identidade Básica
          nome=?, descricao=?, categoria=?, 
          imagem_url=?, banner_url=?, 
          cor_primaria=?, cor_secundaria=?, tema=?,
          
          -- Dados Fiscais & Responsável
          razao_social=?, nome_fantasia=?, cnpj=?, inscricao_estadual=?,
          responsavel_legal=?, cpf_responsavel=?,
          
          -- Dados de Contato
          telefone=?, telefone_loja=?, whatsapp_pedidos=?, 
          responsavel_nome=?, responsavel_telefone=?, responsavel_email=?, email_financeiro=?,
          
          -- Endereço
          endereco=?, cep=?, logradouro=?, numero=?, complemento=?, bairro=?, cidade=?, uf=?,
          latitude=?, longitude=?,
          
          -- Dados Bancários
          banco_codigo=?, banco_nome=?, agencia=?, conta=?, tipo_conta=?, 
          chave_pix_tipo=?, chave_pix_valor=?,
          
          -- Operacional
          horarios_funcionamento=?, tempo_preparo_medio=?, pedido_minimo=?, status_loja=?,
          
          -- Configurações Sistema
          openai_key=?
          
        WHERE usuario_id=?
      `;

      const values = [
        // Identidade
        data.name || data.nome, data.description || data.descricao, data.category || data.categoria,
        data.imageUrl || data.imagem_url, data.bannerUrl || data.banner_url,
        data.primaryColor || data.primary_color || data.cor_primaria, data.secondaryColor || data.secondary_color || data.cor_secundaria, data.themeName || data.theme_name || data.tema,

        // Fiscal
        data.razaoSocial || data.razao_social, data.nomeFantasia || data.nome_fantasia, data.cnpj, data.inscricaoEstadual || data.inscricao_estadual,
        data.responsavelLegal || data.responsavel_legal, data.cpfResponsavel || data.cpf_responsavel,

        // Contato (mantendo compatibilidade com campos antigos e novos)
        data.phone || data.telefone, data.telefoneLoja || data.telefone_loja || data.phone || data.telefone, data.whatsappPedidos || data.whatsapp_pedidos,
        data.responsibleName || data.responsible_name || data.responsavel_nome, data.responsiblePhone || data.responsible_phone || data.responsavel_telefone, data.responsibleEmail || data.responsible_email || data.responsavel_email, data.emailFinanceiro || data.email_financeiro,

        // Endereço
        data.address || data.endereco, data.cep, data.logradouro, data.numero, data.complemento, data.bairro, data.cidade, data.uf,
        data.latitude, data.longitude,

        // Bancário
        data.bancoCodigo || data.banco_codigo, data.bancoNome || data.banco_nome, data.agencia, data.conta, data.tipoConta || data.tipo_conta,
        data.chavePixTipo || data.chave_pix_tipo, data.chavePixValor || data.chave_pix_valor,

        // Operacional
        data.openingHours || data.opening_hours || data.horarios_funcionamento, data.tempoPreparoMedio || data.tempo_preparo_medio, data.pedidoMinimo || data.pedido_minimo, data.statusLoja || data.status_loja,

        // Sistema
        data.openaiKey || data.openai_key,

        // WHERE ID
        userId
      ];

      await db.query(sql, values);
      
      console.log('✅ SUCESSO: Loja atualizada!');
      return res.json({ message: 'Dados da loja atualizados com sucesso!' });

    } catch (error) {
      // AQUI O ERRO APARECE NO TERMINAL
      console.error('❌ ERRO SQL AO SALVAR LOJA:', error.sqlMessage || error.message);
      
      return res.status(500).json({ 
        error: 'Falha ao salvar configurações no banco de dados.',
        detail: error.sqlMessage || error.message 
      });
    }
  }
};
