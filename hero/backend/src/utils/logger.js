const fs = require('fs');
const path = require('path');

// Caminhos
const logDir = path.resolve(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'app.log');

// Garante que a pasta existe apenas uma vez na inicialização
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error('CRITICAL: Não foi possível criar pasta de logs', err);
}

function writeToFile(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta
  };
  
  // Grava no arquivo de forma assíncrona para não travar o app
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(logFile, line, (err) => {
    if (err) console.error('Falha ao escrever no log:', err.message);
  });
}

module.exports = {
  info(message, meta) {
    // 1. Mostra no Console (Útil para o painel da Hostinger)
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    
    // 2. Salva no Arquivo
    writeToFile('info', message, meta);
  },

  error(message, meta) {
    // 1. Mostra no Console (Vermelho se suportado, ou padrão)
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');

    // 2. Salva no Arquivo
    writeToFile('error', message, meta);
  }
};