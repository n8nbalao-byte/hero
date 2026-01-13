const db = require('./src/database');
require('dotenv').config();

async function check() {
  try {
    console.log('🔌 Conectando ao banco...', process.env.DB_HOST);
    
    const [lojas] = await db.query('SELECT COUNT(*) as count FROM lojas');
    const [produtos] = await db.query('SELECT COUNT(*) as count FROM produtos');
    const [usuarios] = await db.query('SELECT COUNT(*) as count FROM usuarios');

    console.log('📊 Status do Banco de Dados:');
    console.log(`- Lojas: ${lojas[0].count}`);
    console.log(`- Produtos: ${produtos[0].count}`);
    console.log(`- Usuários: ${usuarios[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar/consultar:', error);
    process.exit(1);
  }
}

check();
