require('dotenv').config();
const db = require('./src/database');

async function run() {
  try {
    console.log('Testing Admin Queries...');

    console.log('1. Users Group By Role');
    const [users] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('Users:', users);

    console.log('2. Stores Count');
    const [stores] = await db.query('SELECT COUNT(*) as count FROM stores');
    console.log('Stores:', stores);

    console.log('3. Orders Stats');
    const [orders] = await db.query('SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM orders WHERE status = "delivered"');
    console.log('Orders:', orders);

    console.log('4. Store List');
    const [storeList] = await db.query(`
        SELECT s.id, s.name, s.category, s.status_loja, u.email as owner_email, s.created_at 
        FROM stores s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC LIMIT 20
      `);
    console.log('Store List:', storeList.length);

    console.log('5. Courier List');
    const [courierList] = await db.query(`
        SELECT id, name, email, phone, is_online, created_at 
        FROM users 
        WHERE role = 'courier' 
        ORDER BY created_at DESC LIMIT 20
      `); // Check if is_online exists
    console.log('Courier List:', courierList.length);

    console.log('6. Recent Orders');
    const [recentOrders] = await db.query(`
        SELECT o.id, o.total_amount, o.status, o.created_at, s.name as store_name, u.name as client_name
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        JOIN users u ON o.client_id = u.id 
        ORDER BY o.created_at DESC LIMIT 10
      `); // Note: Previous code used u.id join but aliased as client_name, check join logic
      // In OrderController.index it joins o.client_id = c.id
      // In AdminController it joined users u ON o.user_id = u.id -- Wait, orders table usually has client_id, not user_id?
      // Let's check OrderController.store: INSERT INTO orders (client_id, ...)
      // So the column is client_id.
      // AdminController used: JOIN users u ON o.user_id = u.id. THIS IS LIKELY THE ERROR if column is client_id.

    console.log('Recent Orders:', recentOrders.length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();