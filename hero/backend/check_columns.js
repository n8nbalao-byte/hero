require('dotenv').config();
const db = require('./src/database');

async function run() {
  try {
    const [storeCols] = await db.query('SHOW COLUMNS FROM stores');
    console.log('Stores Columns:', storeCols.map(c => c.Field));

    const [userCols] = await db.query('SHOW COLUMNS FROM users');
    console.log('Users Columns:', userCols.map(c => c.Field));

    const [orderCols] = await db.query('SHOW COLUMNS FROM orders');
    console.log('Orders Columns:', orderCols.map(c => c.Field));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();