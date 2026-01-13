const db = require('./src/database');

async function clean() {
  console.log('🧹 Iniciando limpeza total do banco de dados...');
  try {
    // Desativa verificação de chaves estrangeiras para permitir TRUNCATE em qualquer ordem
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Limpa todas as tabelas e reseta os IDs
    await db.query('TRUNCATE TABLE order_items');
    console.log('✅ order_items limpa');
    
    await db.query('TRUNCATE TABLE orders');
    console.log('✅ orders limpa');

    await db.query('TRUNCATE TABLE products');
    console.log('✅ products limpa');

    await db.query('TRUNCATE TABLE stores');
    console.log('✅ stores limpa');

    await db.query('TRUNCATE TABLE users');
    console.log('✅ users limpa');

    // Reativa a verificação
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✨ Limpeza concluída! O banco de dados está vazio e pronto para novos cadastros.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    process.exit(1);
  }
}

clean();
