require('dotenv').config();
const db = require('./src/database');
const bcrypt = require('bcryptjs');

async function resetAndSeed() {
  console.log('🚨 INICIANDO RESET TOTAL DO BANCO DE DADOS...');

  try {
    // 1. Limpar tabelas (DROP para garantir schema atualizado)
    console.log('🧹 Excluindo tabelas antigas...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await db.query('DROP TABLE IF EXISTS itens_pedido');
    await db.query('DROP TABLE IF EXISTS pedidos');
    await db.query('DROP TABLE IF EXISTS produtos');
    await db.query('DROP TABLE IF EXISTS lojas');
    await db.query('DROP TABLE IF EXISTS veiculos_usuario'); // Garantir que essa também vai
    await db.query('DROP TABLE IF EXISTS usuarios');
    
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tabelas excluídas.');

    // Recriar tabelas usando a função do index.js
    console.log('🔄 Recriando tabelas...');
    await db.initDb();

    // 2. Preparar hashes de senha
    const hashAdmin = await bcrypt.hash('admin', 8);
    const hashCommon = await bcrypt.hash('010203', 8);

    // 3. Criar Usuários
    console.log('👤 Criando novos usuários...');

    // Admin (admin / admin)
    // Nota: O email será 'admin' para permitir login com 'admin', assumindo que o frontend não bloqueie.
    await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo) 
      VALUES (?, ?, ?, ?)
    `, ['Admin Master', 'admin', hashAdmin, 'admin']);

    // Lojista (loja1@teste.com / 010203)
    const [shopOwner] = await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Lojista Teste', 'loja1@teste.com', hashCommon, 'shop_owner', '19999991111']);

    // Cliente (cliente1@teste.com / 010203)
    await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Cliente Teste', 'cliente1@teste.com', hashCommon, 'client', '19999992222']);

    // Entregador (entregador1@teste.com / 010203)
    await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['Entregador Teste', 'entregador1@teste.com', hashCommon, 'courier', '19999993333', 'Moto', 'ABC-1234']);

    console.log('✅ Usuários criados.');

    // 4. Criar Loja para o Lojista
    console.log('🏪 Criando loja para o lojista...');
    const hours = JSON.stringify({ 
      mon: { open: true, from: '08:00', to: '22:00' }, 
      tue: { open: true, from: '08:00', to: '22:00' },
      wed: { open: true, from: '08:00', to: '22:00' },
      thu: { open: true, from: '08:00', to: '22:00' },
      fri: { open: true, from: '08:00', to: '22:00' },
      sat: { open: true, from: '08:00', to: '22:00' },
      sun: { open: true, from: '08:00', to: '22:00' }
    });

    const [store] = await db.query(`
      INSERT INTO lojas (
        usuario_id, nome, categoria, endereco, telefone, 
        latitude, longitude, imagem_url, banner_url, 
        status_loja, horarios_funcionamento, tempo_preparo_medio, pedido_minimo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      shopOwner.insertId, 
      'Loja Teste 1', 
      'Lanches', 
      'Rua Teste, 100, Centro, Campinas', 
      '1933334444', 
      -22.905560, -47.060830, // Centro de Campinas
      'https://images.unsplash.com/photo-1561758033-d8f48f8f4f23?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Imagem genérica
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=60', // Banner genérico
      'aberta',
      hours,
      30,
      15.00
    ]);

    console.log('✅ Loja criada.');

    // 5. Criar Produtos para a Loja
    console.log('🍔 Criando produtos de teste...');
    const storeId = store.insertId;

    const products = [
      { nome: 'X-Bacon', descricao: 'Pão, hambúrguer, queijo, bacon e salada', preco: 25.90, cat: 'Lanches' },
      { nome: 'Coca-Cola 350ml', descricao: 'Gelada', preco: 6.00, cat: 'Bebidas' },
      { nome: 'Batata Frita', descricao: 'Porção média', preco: 18.00, cat: 'Acompanhamentos' }
    ];

    for (const p of products) {
      await db.query(`
        INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, estoque, imagem_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        storeId, 
        p.nome, 
        p.descricao, 
        p.preco, 
        p.cat, 
        100,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      ]);
    }

    console.log('✅ Produtos criados.');
    console.log('🎉 RESET E SEED CONCLUÍDOS COM SUCESSO!');
    console.log('\nCredenciais criadas:');
    console.log('Admin: admin / admin');
    console.log('Lojista: loja1@teste.com / 010203');
    console.log('Cliente: cliente1@teste.com / 010203');
    console.log('Entregador: entregador1@teste.com / 010203');

    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    process.exit(1);
  }
}

resetAndSeed();
