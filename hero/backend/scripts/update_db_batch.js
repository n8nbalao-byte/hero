const db = require('../src/database');

async function updateDb() {
  try {
    const connection = await db.getConnection();
    console.log("Connected to database...");

    try {
      // Check if column exists (simple try/catch or just run alter and ignore error if duplicate)
      // Since MySQL doesn't support "IF NOT EXISTS" in ALTER TABLE ADD COLUMN easily in all versions without a procedure,
      // we'll try to add it.
      await connection.query("ALTER TABLE orders ADD COLUMN batch_id VARCHAR(36) NULL AFTER status");
      console.log("Column 'batch_id' added successfully.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Column 'batch_id' already exists.");
      } else {
        console.error("Error adding column:", e);
      }
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

updateDb();
