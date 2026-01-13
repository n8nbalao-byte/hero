const db = require('./src/database');
require('dotenv').config();

async function clearProducts() {
  try {
    console.log('🗑️  Iniciando limpeza de produtos...');

    // 1. Limpar itens de pedidos (pois referenciam produtos)
    console.log('... Limpando itens de pedidos (order_items)...');
    await db.query('DELETE FROM order_items');
    
    // 2. Limpar produtos
    console.log('... Limpando tabela de produtos (products)...');
    const [result] = await db.query('DELETE FROM products');

    console.log(`✅ Sucesso! ${result.affectedRows} produtos foram excluídos.`);
    console.log('⚠️  Atenção: Os itens dos pedidos existentes também foram removidos para manter a integridade.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar produtos:', error);
    process.exit(1);
  }
}

clearProducts();
