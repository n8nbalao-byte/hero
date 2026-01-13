const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path'); // <--- Importante
const db = require('./database');
const routes = require('./routes');

require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Permite carregar imagens em outro dominio
}));
app.use(cors());

// Aumentando limite para JSON e URL-Encoded (para Base64 da Kalunga)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS (FOTOS) ---
// Agora http://localhost:3000/uploads/foto.jpg vai funcionar
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// --- FRONTEND ESTÁTICO (PRODUÇÃO) ---
app.use(express.static(path.resolve(__dirname, '..', 'public')));

// Routes (Prefixado com /api)
app.use('/api', routes);

// Catch-all para React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  Aviso: JWT_SECRET não definido.');
    process.env.JWT_SECRET = 'dev-secret';
  }

  try {
    await db.query('SELECT 1');
    console.log('✅ MySQL Database connected successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});