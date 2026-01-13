const axios = require('axios');

const API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'; // Ajuste conforme necessário
const API_KEY = process.env.EVOLUTION_API_KEY || 'SEU_TOKEN_AQUI';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'campinas_shopping';

module.exports = {
  async sendText(number, text) {
    if (!number) return;
    
    // Formata número (remove caracteres não numéricos)
    let cleanNumber = number.replace(/\D/g, '');
    
    // Adiciona 55 se não tiver
    if (cleanNumber.length <= 11) {
        cleanNumber = '55' + cleanNumber;
    }

    // Adiciona @s.whatsapp.net
    const remoteJid = `${cleanNumber}@s.whatsapp.net`;

    try {
      await axios.post(`${API_URL}/message/sendText/${INSTANCE}`, {
        number: remoteJid,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: false
        },
        textMessage: {
          text: text
        }
      }, {
        headers: {
          apikey: API_KEY
        }
      });
      console.log(`[WhatsApp] Mensagem enviada para ${cleanNumber}`);
    } catch (error) {
      console.error(`[WhatsApp] Erro ao enviar para ${cleanNumber}:`, error.message);
    }
  }
};
