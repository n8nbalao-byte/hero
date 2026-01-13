const db = require('../src/database');

async function migrate() {
  try {
    console.log('🔄 Verificando coluna observacoes na tabela pedidos...');
    
    // Check if column exists
    const [columns] = await db.query("SHOW COLUMNS FROM pedidos LIKE 'observacoes'");
    
    if (columns.length === 0) {
      console.log('⚠️ Coluna não existe. Adicionando...');
      await db.query("ALTER TABLE pedidos ADD COLUMN observacoes TEXT AFTER endereco_entrega");
      console.log('✅ Coluna observacoes adicionada com sucesso!');
    } else {
      console.log('✅ Coluna observacoes já existe.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
