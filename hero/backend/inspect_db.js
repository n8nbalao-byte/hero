const db = require('./src/database');

async function inspect() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM itens_pedido");
    console.log('COLUMNS:', columns);
    
    // Also check one row
    const [rows] = await db.query("SELECT * FROM itens_pedido LIMIT 1");
    console.log('FIRST ROW:', rows[0]);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

inspect();
