const db = require('./database/index');

async function check() {
  console.log('🔍 Verificando Banco de Dados...');
  
  try {
    // 1. Verificar Usuários
    const [users] = await db.query('SELECT id, nome, email, tipo FROM usuarios');
    console.log('\n👤 Usuários:', users.length);
    users.forEach(u => console.log(`   [ID: ${u.id}] ${u.nome} (${u.email}) - ${u.tipo}`));

    // 2. Verificar Lojas
    const [stores] = await db.query('SELECT id, nome, usuario_id FROM lojas');
    console.log('\n🏪 Lojas:', stores.length);
    stores.forEach(s => console.log(`   [ID: ${s.id}] ${s.nome} (Dono ID: ${s.usuario_id})`));

    // 3. Verificar Produtos
    const [products] = await db.query('SELECT id, nome, loja_id FROM produtos');
    console.log('\n📦 Produtos:', products.length);
    products.forEach(p => console.log(`   [ID: ${p.id}] ${p.nome} -> Pertence à Loja ID: ${p.loja_id}`));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();