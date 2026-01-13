const db = require('../src/database');

async function run() {
  try {
    const connection = await db.getConnection();
    console.log("Conectado ao banco de dados.");

    console.log("Adicionando coluna observacoes em pedidos...");
    try {
        await connection.query("ALTER TABLE pedidos ADD COLUMN observacoes TEXT NULL AFTER endereco_entrega");
        console.log("Coluna observacoes adicionada.");
    } catch (e) {
        console.log("Coluna observacoes já existe ou erro:", e.message);
    }

    console.log("Migração concluída.");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

run();
