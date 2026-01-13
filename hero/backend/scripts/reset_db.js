const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function reset() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        console.log('🔥 Iniciando reset do banco de dados...');

        // Desativar verificação de chave estrangeira
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('🗑️ Excluindo itens de pedidos...');
        await connection.query('TRUNCATE TABLE order_items');

        console.log('🗑️ Excluindo pedidos...');
        await connection.query('TRUNCATE TABLE orders');

        console.log('🗑️ Excluindo produtos...');
        await connection.query('TRUNCATE TABLE products');

        console.log('🗑️ Excluindo lojas...');
        await connection.query('TRUNCATE TABLE stores');
        
        console.log('🗑️ Excluindo veículos de usuários...');
        // Verifica se tabela existe antes de truncar (para evitar erro se não tiver sido criada)
        const [tables] = await connection.query("SHOW TABLES LIKE 'user_vehicles'");
        if (tables.length > 0) {
            await connection.query('TRUNCATE TABLE user_vehicles');
        }

        console.log('🗑️ Excluindo usuários (clientes, entregadores, lojistas)...');
        // Mantém apenas o ADMIN e re-ajusta o AUTO_INCREMENT se possível (não é trivial com dados existentes, então deixa)
        // Se não houver admin, deleta tudo.
        await connection.query("DELETE FROM users WHERE role != 'admin'");
        
        // Opcional: Se quiser limpar tudo mesmo (descomente abaixo)
        // await connection.query('TRUNCATE TABLE users'); 

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Banco de dados limpo com sucesso! (Contas Admin preservadas)');
    } catch (error) {
        console.error('❌ Erro ao resetar banco:', error);
    } finally {
        await connection.end();
        process.exit();
    }
}

reset();
