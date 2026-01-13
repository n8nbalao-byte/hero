const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

async function seed() {
    console.log('🌱 Iniciando seed para banco de dados em Português...');
    console.log(`🔌 Conectando a ${dbConfig.host}...`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado com sucesso!');

        // 1. Verificar e criar Loja Exemplo
        const [stores] = await connection.query('SELECT * FROM lojas LIMIT 1');
        let storeId;

        if (stores.length === 0) {
            console.log('🏪 Criando loja exemplo...');
            // Precisamos de um usuario_id válido. Vamos pegar o primeiro admin ou criar um.
            const [users] = await connection.query("SELECT id FROM usuarios WHERE tipo = 'admin' OR tipo = 'shop_owner' LIMIT 1");
            let userId;
            
            if (users.length > 0) {
                userId = users[0].id;
            } else {
                console.log('👤 Criando usuário dono de loja...');
                const [userResult] = await connection.query(`
                    INSERT INTO usuarios (nome, email, senha, tipo) 
                    VALUES ('Dono da Loja', 'loja@exemplo.com', '$2a$10$ExemploHashSenha123', 'shop_owner')
                `);
                userId = userResult.insertId;
            }

            const [storeResult] = await connection.query(`
                INSERT INTO lojas (
                    usuario_id, nome, descricao, endereco, categoria, 
                    imagem_url, status_loja, tempo_preparo_medio, pedido_minimo
                ) VALUES (
                    ?, 'Campinas Tech Store', 'Melhores eletrônicos da região', 'Av. Francisco Glicério, 1000, Centro', 'Eletrônicos',
                    'https://images.unsplash.com/photo-1498049384371-061844988cf4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    'aberta', 45, 10.00
                )
            `, [userId]);
            storeId = storeResult.insertId;
            console.log(`✅ Loja criada com ID: ${storeId}`);
        } else {
            storeId = stores[0].id;
            console.log(`ℹ️ Loja já existe com ID: ${storeId}`);
        }

        // 2. Verificar e criar Produtos
        const [products] = await connection.query('SELECT * FROM produtos LIMIT 1');
        
        if (products.length === 0) {
            console.log('📦 Criando produtos exemplo...');
            const sampleProducts = [
                {
                    nome: 'Smartphone X',
                    descricao: 'Última geração, 128GB, Câmera 48MP',
                    preco: 1999.90,
                    imagem_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    categoria: 'Smartphones'
                },
                {
                    nome: 'Notebook Pro',
                    descricao: 'Processador i7, 16GB RAM, SSD 512GB',
                    preco: 4500.00,
                    imagem_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    categoria: 'Computadores'
                },
                {
                    nome: 'Fone Bluetooth',
                    descricao: 'Cancelamento de ruído, bateria 24h',
                    preco: 299.90,
                    imagem_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    categoria: 'Acessórios'
                },
                {
                    nome: 'Smartwatch Fit',
                    descricao: 'Monitor cardíaco, GPS, à prova d\'água',
                    preco: 399.00,
                    imagem_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    categoria: 'Wearables'
                }
            ];

            for (const p of sampleProducts) {
                await connection.query(`
                    INSERT INTO produtos (loja_id, nome, descricao, preco, imagem_url, categoria, estoque)
                    VALUES (?, ?, ?, ?, ?, ?, 100)
                `, [storeId, p.nome, p.descricao, p.preco, p.imagem_url, p.categoria]);
            }
            console.log('✅ 4 produtos criados com sucesso!');
        } else {
            console.log('ℹ️ Produtos já existem no banco.');
        }

        console.log('🎉 Seed concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
