require('dotenv').config();
const db = require('./src/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const email = 'admin@master.com';
  const password = 'adminmaster';
  const name = 'Admin Master';
  const role = 'admin';

  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    
    // Check if exists
    // users -> usuarios, email -> email
    const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (users.length > 0) {
      console.log('Admin user already exists. Updating password and role...');
      // password -> senha, role -> tipo
      await db.query('UPDATE usuarios SET senha = ?, tipo = ? WHERE email = ?', [hashedPassword, role, email]);
    } else {
      console.log('Creating new Admin user...');
      // name -> nome, password -> senha, role -> tipo
      await db.query('INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
    }
    
    console.log(`✅ Admin User Ready: ${email} / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
