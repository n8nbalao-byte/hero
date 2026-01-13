const db = require('./src/database');

async function check() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM pedidos");
    console.log(JSON.stringify(columns.map(c => c.Field), null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
