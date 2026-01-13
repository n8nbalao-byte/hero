const db = require('./index');

async function reset() {
  console.log('💥 APAGANDO TABELAS ANTIGAS...');
  try {
    // 1. Desativa verificação de chaves estrangeiras (O segredo para não dar erro)
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Apaga as tabelas sem dó
    await db.query('DROP TABLE IF EXISTS order_items');
    await db.query('DROP TABLE IF EXISTS orders');
    await db.query('DROP TABLE IF EXISTS products');
    await db.query('DROP TABLE IF EXISTS stores');
    await db.query('DROP TABLE IF EXISTS users');

    // 3. Reativa a verificação de segurança
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Todas as tabelas foram apagadas!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao apagar tabelas:', error);
    process.exit(1);
  }
}

reset();