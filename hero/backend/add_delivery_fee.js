require('dotenv').config();
const db = require('./src/database');

async function run() {
  try {
    await db.query(`ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0.00 AFTER total_amount`);
    console.log('Column delivery_fee added');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column delivery_fee already exists');
    } else {
      console.error(error);
    }
    process.exit(0);
  }
}
run();
