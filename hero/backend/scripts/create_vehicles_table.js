const db = require('../src/database');

async function run() {
  try {
    const connection = await db.getConnection();
    console.log("Conectado ao banco de dados.");

    console.log("Criando tabela user_vehicles...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50),
        plate VARCHAR(20),
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Tabela user_vehicles criada/verificada.");

    // Opcional: Migrar dados existentes da tabela users
    console.log("Verificando veículos existentes em users...");
    const [users] = await connection.query("SELECT id, vehicle_type, vehicle_plate FROM users WHERE role = 'courier'");
    
    for (const user of users) {
        if (user.vehicle_plate) {
            // Verifica se já existe na nova tabela para não duplicar
            const [existing] = await connection.query("SELECT id FROM user_vehicles WHERE user_id = ? AND plate = ?", [user.id, user.vehicle_plate]);
            if (existing.length === 0) {
                console.log(`Migrando veículo do usuário ${user.id}...`);
                await connection.query(
                    "INSERT INTO user_vehicles (user_id, type, plate, model) VALUES (?, ?, ?, ?)",
                    [user.id, user.vehicle_type || 'Moto', user.vehicle_plate, '']
                );
            }
        }
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