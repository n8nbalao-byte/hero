const db = require('../src/database');

async function run() {
  try {
    const connection = await db.getConnection();
    console.log("Conectado ao banco de dados.");

    console.log("Adicionando colunas de documentos em users...");
    try {
        await connection.query("ALTER TABLE users ADD COLUMN cnh_url TEXT NULL AFTER avatar_url");
        console.log("Coluna cnh_url adicionada.");
    } catch (e) {
        console.log("Coluna cnh_url já existe ou erro:", e.message);
    }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN document_url TEXT NULL AFTER cnh_url");
        console.log("Coluna document_url adicionada.");
    } catch (e) {
        console.log("Coluna document_url já existe ou erro:", e.message);
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