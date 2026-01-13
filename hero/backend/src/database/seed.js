const db = require('./index'); // Importa a conexão MySQL Nativa
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Iniciando Seed do Banco de Dados...');

    // 1. LIMPEZA (Ordem importa por causa das chaves estrangeiras)
    console.log('🧹 Limpando tabelas antigas...');
    // Usamos DELETE para limpar os dados mas manter a estrutura
    try { await db.query('DELETE FROM itens_pedido'); } catch(e){}
    try { await db.query('DELETE FROM pedidos'); } catch(e){}
    try { await db.query('DELETE FROM produtos'); } catch(e){}
    try { await db.query('DELETE FROM lojas'); } catch(e){}
    try { await db.query('DELETE FROM usuarios'); } catch(e){}
    
    // Reseta os IDs (Auto Increment)
    try { await db.query('ALTER TABLE usuarios AUTO_INCREMENT = 1'); } catch(e){}
    try { await db.query('ALTER TABLE lojas AUTO_INCREMENT = 1'); } catch(e){}
    try { await db.query('ALTER TABLE produtos AUTO_INCREMENT = 1'); } catch(e){}
    try { await db.query('ALTER TABLE pedidos AUTO_INCREMENT = 1'); } catch(e){}

    // 2. CRIAR USUÁRIOS
    console.log('👤 Criando Usuários...');
    const passwordHash = await bcrypt.hash('123456', 8);

    // Admin
    await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin Master', 'admin@teste.com', passwordHash, 'admin', '19999990000']);

    // Cliente
    await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Cliente Teste', 'cliente@teste.com', passwordHash, 'client', '19999990001']);

    // Motoboys (3)
    await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa, whatsapp, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Motoboy 1', 'motoboy1@teste.com', passwordHash, 'courier', '19999991001', 'Moto', 'ABC1D23', '19999991001', 'https://via.placeholder.com/128?text=Motoboy+1']);
    
    await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa, whatsapp, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Motoboy 2', 'motoboy2@teste.com', passwordHash, 'courier', '19999991002', 'Moto', 'DEF4G56', '19999991002', 'https://via.placeholder.com/128?text=Motoboy+2']);
    
    await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa, whatsapp, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Motoboy 3', 'motoboy3@teste.com', passwordHash, 'courier', '19999991003', 'Moto', 'HIJ7K89', '19999991003', 'https://via.placeholder.com/128?text=Motoboy+3']);

    // Lojistas (3)
    const [shop1] = await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)`, ['Lojista 1', 'loja1@teste.com', passwordHash, 'shop_owner', '19999992001']);
    const [shop2] = await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)`, ['Lojista 2', 'loja2@teste.com', passwordHash, 'shop_owner', '19999992002']);
    const [shop3] = await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)`, ['Lojista 3', 'loja3@teste.com', passwordHash, 'shop_owner', '19999992003']);

    // 3. CRIAR LOJAS E PRODUTOS
    console.log('🏪 Criando Lojas e Produtos...');

    // Loja 1
    const hours = JSON.stringify({ mon: { open: true, from: '09:00', to: '18:00' }, sat: { open: false, from: '', to: '' } });
    const [store1] = await db.query(`
      INSERT INTO lojas (usuario_id, nome, categoria, endereco, telefone, latitude, longitude, imagem_url, horarios_funcionamento, banner_url, cor_primaria) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [shop1.insertId, 'Numero 1 Informatica', 'Informatica', 'Av. Francisco Glicério, 1000 - Centro', '19999999999', -22.905560, -47.060830, 'https://via.placeholder.com/150?text=Loja1', hours, 'https://via.placeholder.com/800x200?text=Banner+Loja1', '#0000FF']);

    await db.query(`INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, estoque, imagem_url) VALUES ?`, [[
      [store1.insertId, 'Notebook Dell Inspiron', 'i5, 8GB RAM, 256GB SSD', 3500.00, 'Notebooks', 10, 'https://via.placeholder.com/300?text=Note'],
      [store1.insertId, 'Projetor Epson', 'Full HD, 3000 lumens', 2800.00, 'Projetores', 5, 'https://via.placeholder.com/300?text=Projetor'],
      [store1.insertId, 'Drone DJI Mini', 'Camera 4K, 30min voo', 4500.00, 'Drones', 3, 'https://via.placeholder.com/300?text=Drone']
    ]]);

    // Loja 2
    const [store2] = await db.query(`
      INSERT INTO lojas (usuario_id, nome, categoria, endereco, telefone, latitude, longitude, imagem_url, horarios_funcionamento, banner_url, cor_primaria) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [shop2.insertId, 'Atacado Campinas', 'Variedades', 'Rua 13 de Maio, 500 - Centro', '19888888888', -22.907000, -47.062000, 'https://via.placeholder.com/150?text=Loja2', hours, 'https://via.placeholder.com/800x200?text=Banner+Loja2', '#FF0000']);

    await db.query(`INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, estoque, imagem_url) VALUES ?`, [[
      [store2.insertId, 'Carrinho Controle Remoto', 'Alta velocidade', 150.00, 'Brinquedos', 50, 'https://via.placeholder.com/300?text=Carrinho'],
      [store2.insertId, 'Boneca Articulada', 'Com acessorios', 80.00, 'Brinquedos', 40, 'https://via.placeholder.com/300?text=Boneca'],
      [store2.insertId, 'Mouse Pad Gamer', 'Extra grande', 40.00, 'Acessorios', 100, 'https://via.placeholder.com/300?text=MousePad']
    ]]);

    // Loja 3
    const [store3] = await db.query(`
      INSERT INTO lojas (usuario_id, nome, categoria, endereco, telefone, latitude, longitude, imagem_url, horarios_funcionamento, banner_url, cor_primaria) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [shop3.insertId, 'Fornecedor 3 Games', 'Games', 'Av. Barão de Itapura, 2000', '19777777777', -22.890000, -47.070000, 'https://via.placeholder.com/150?text=Loja3', hours, 'https://via.placeholder.com/800x200?text=Banner+Loja3', '#00FF00']);

    await db.query(`INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, estoque, imagem_url) VALUES ?`, [[
      [store3.insertId, 'SSD Kingston 480GB', 'SATA 3', 250.00, 'Hardware', 30, 'https://via.placeholder.com/300?text=SSD'],
      [store3.insertId, 'Memoria RAM 8GB', 'DDR4 2666MHz', 180.00, 'Hardware', 25, 'https://via.placeholder.com/300?text=RAM'],
      [store3.insertId, 'PlayStation 5', 'Console com leitor', 4500.00, 'Consoles', 5, 'https://via.placeholder.com/300?text=PS5']
    ]]);

    // 4. CONFIGURAÇÕES INICIAIS
    console.log('⚙️ Configurando Padrões...');
    await db.query(`INSERT INTO configuracoes (chave, valor) VALUES ('pix_discount', '15') ON DUPLICATE KEY UPDATE valor = '15'`);

    console.log('✅ Seed Finalizado com Sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro no Seed:', error);
    process.exit(1);
  }
}

seed();