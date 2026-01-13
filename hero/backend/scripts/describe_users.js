const db = require('../src/database');

async function run() {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query("DESCRIBE users");
    console.log(rows);
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();