require('dotenv').config();
const db = require('./src/database');

async function run() {
  try {
    console.log('Running Migration...');

    // 1. Check if stores has created_at
    try {
        await db.query('ALTER TABLE stores ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        console.log('✅ Added created_at to stores');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ stores.created_at already exists');
        else console.error('Error adding created_at to stores:', e);
    }

    // 2. Add delivery_code to orders
    try {
        await db.query('ALTER TABLE orders ADD COLUMN delivery_code VARCHAR(10)');
        console.log('✅ Added delivery_code to orders');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ orders.delivery_code already exists');
        else console.error('Error adding delivery_code to orders:', e);
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
run();