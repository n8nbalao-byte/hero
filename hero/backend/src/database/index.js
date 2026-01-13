const mysql = require('mysql2');
require('dotenv').config();

// Cria a conexão (Pool de conexões é mais eficiente)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Função para Inicializar as Tabelas
async function initDb() {
  try {
    console.log('🔄 Conectando ao MySQL e verificando tabelas...');

    // 1. Tabela de Usuários (usuarios)
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255),
        tipo VARCHAR(50) DEFAULT 'client', -- client, courier, shop_owner, admin
        telefone VARCHAR(20),
        veiculo_tipo VARCHAR(50),
        veiculo_placa VARCHAR(20),
        whatsapp VARCHAR(20),
        online TINYINT(1) DEFAULT 0,
        latitude_atual DECIMAL(10, 8),
        longitude_atual DECIMAL(11, 8),
        google_id VARCHAR(255),
        avatar_url TEXT,
        cnh_url TEXT,
        document_url TEXT,
        cpf VARCHAR(14),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // --- MIGRAÇÕES MANUAIS (Para bancos existentes) ---
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'cpf'");
        if (cols.length === 0) {
            console.log("⚠️ Coluna 'cpf' ausente em 'usuarios'. Adicionando...");
            await db.query("ALTER TABLE usuarios ADD COLUMN cpf VARCHAR(14)");
            console.log("✅ Coluna 'cpf' adicionada com sucesso.");
        }
    } catch (e) { console.error("Erro ao verificar/criar coluna cpf", e); }

    // 2. Tabela de Lojas (lojas)
    await db.query(`
      CREATE TABLE IF NOT EXISTS lojas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nome VARCHAR(255),
        descricao TEXT,
        telefone VARCHAR(50),
        endereco VARCHAR(255),
        categoria VARCHAR(100),
        imagem_url LONGTEXT,
        banner_url LONGTEXT,
        cor_primaria VARCHAR(20) DEFAULT '#DC0000',
        cor_secundaria VARCHAR(20) DEFAULT '#333333',
        tema VARCHAR(50) DEFAULT 'custom',
        
        -- Dados Fiscais & Responsável
        razao_social VARCHAR(255),
        nome_fantasia VARCHAR(255),
        cnpj VARCHAR(20),
        inscricao_estadual VARCHAR(50),
        responsavel_legal VARCHAR(255),
        cpf_responsavel VARCHAR(20),
        
        -- Contato
        telefone_loja VARCHAR(20),
        whatsapp_pedidos VARCHAR(20),
        responsavel_nome VARCHAR(255),
        responsavel_telefone VARCHAR(20),
        responsavel_email VARCHAR(255),
        email_financeiro VARCHAR(255),

        -- Endereço Completo
        cep VARCHAR(10),
        logradouro VARCHAR(255),
        numero VARCHAR(20),
        complemento VARCHAR(100),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        uf CHAR(2),

        -- Dados Bancários
        banco_codigo VARCHAR(10),
        banco_nome VARCHAR(100),
        agencia VARCHAR(20),
        conta VARCHAR(20),
        tipo_conta VARCHAR(20),
        chave_pix_tipo VARCHAR(50),
        chave_pix_valor VARCHAR(255),

        -- Operacional
        tempo_preparo_medio INT DEFAULT 30,
        pedido_minimo DECIMAL(10,2) DEFAULT 0,
        status_loja VARCHAR(20) DEFAULT 'fechada',

        openai_key VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        horarios_funcionamento TEXT, -- JSON string
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // 3. Tabela de Produtos (produtos)
    await db.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loja_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10, 2) NOT NULL,
        categoria VARCHAR(100),
        imagem_url LONGTEXT,
        estoque INT DEFAULT 0,
        fornecedor VARCHAR(100),
        link_original TEXT,
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE
      )
    `);

    // 4. Tabela de Pedidos (pedidos)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        loja_id INT,
        motoboy_id INT,
        valor_total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        endereco_entrega TEXT,
        observacoes TEXT,
        metodo_pagamento VARCHAR(50),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        taxa_entrega DECIMAL(10, 2) DEFAULT 0,
        codigo_entrega VARCHAR(10),
        codigo_coleta_loja VARCHAR(10),
        codigo_coleta_admin VARCHAR(10),
        etapa_status VARCHAR(50) DEFAULT 'pending',
        latitude_entrega DECIMAL(10, 8),
        longitude_entrega DECIMAL(11, 8),
        lote_id VARCHAR(36),
        FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
        FOREIGN KEY (loja_id) REFERENCES lojas(id),
        FOREIGN KEY (motoboy_id) REFERENCES usuarios(id)
      )
    `);

    // 5. Itens do Pedido (itens_pedido)
    await db.query(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pedido_id INT NOT NULL,
        produto_id INT NOT NULL,
        quantidade INT NOT NULL,
        preco_momento DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);

    // 6. Tabela de Configurações (configuracoes)
    await db.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chave VARCHAR(50) UNIQUE NOT NULL,
        valor TEXT,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 7. Veículos do Usuário (veiculos_usuario)
    await db.query(`
      CREATE TABLE IF NOT EXISTS veiculos_usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(50),
        placa VARCHAR(20),
        modelo VARCHAR(100),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabelas verificadas/criadas com sucesso (Português)!');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
}

// Inicializa assim que o arquivo é chamado
initDb();

module.exports = db;
module.exports.initDb = initDb;
