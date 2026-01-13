const mysql = require('mysql2/promise');
require('dotenv').config();

async function dropOldTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const oldTables = [
    'users',
    'stores',
    'products',
    'orders',
    'order_items',
    'settings',
    'courier_vehicles',
    'notifications',
    'chats',
    'messages',
    'delivery_codes' // if it existed
  ];

  try {
    // Disable foreign key checks to avoid constraint errors
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of oldTables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`Table '${table}' dropped (if it existed).`);
      } catch (err) {
        console.error(`Error dropping table '${table}':`, err.message);
      }
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Finished dropping old English tables.');
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await connection.end();
  }
}

dropOldTables();
