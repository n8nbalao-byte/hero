const db = require('./src/database/index');

async function fixStore() {
  console.log('🔧 Corrigindo nome da loja...');
  try {
    await db.query(`UPDATE lojas SET nome = 'Campinas Tech Store' WHERE id = 2 AND nome IS NULL`);
    console.log('✅ Nome da loja atualizado para "Campinas Tech Store"');
    
    // Verificar resultado
    const [rows] = await db.query('SELECT id, nome FROM lojas WHERE id = 2');
    console.log('📊 Estado atual:', rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixStore();
