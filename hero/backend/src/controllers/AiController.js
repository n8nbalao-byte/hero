const OpenAI = require('openai');
const db = require('../database');

module.exports = {
  async generateDescription(req, res) {
    try {
      const { productName, productPrice } = req.body;
      const userId = req.userId; // Vem do Token

      // 1. Busca a chave API da loja do usuário
      // stores -> lojas, user_id -> usuario_id
      const [store] = await db.query('SELECT openai_key FROM lojas WHERE usuario_id = ?', [userId]);

      if (!store || !store[0].openai_key) {
        return res.status(400).json({ error: 'Chave OpenAI não configurada nas Configurações da Loja.' });
      }

      // 2. Configura a OpenAI com a chave do cliente
      const openai = new OpenAI({ apiKey: store[0].openai_key });

      // 3. Pede para a IA gerar o texto
      const prompt = `Crie uma descrição comercial persuasiva, curta e formatada (com tópicos) para o produto: "${productName}" que custa aproximadamente R$ ${productPrice}. Foque em benefícios e use emojis. Use HTML básico (<br> para pular linha, <b> para negrito).`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      const description = completion.choices[0].message.content;

      return res.json({ description });

    } catch (error) {
      console.error('Erro OpenAI:', error);
      return res.status(500).json({ error: 'Erro ao gerar descrição. Verifique sua chave API ou saldo.' });
    }
  }
};