const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  async index(req, res) {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });

    try {
      // 1. Acessa o site fingindo ser um navegador real
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // 2. Carrega o HTML
      const $ = cheerio.load(data);

      // 3. Extrai dados usando padrões da web (Open Graph e Meta Tags)
      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content') || '';
      
      // 4. Tenta achar o preço (Procura por padrões de moeda R$)
      let price = '';
      const bodyText = $('body').text();
      // Regex para achar preços como 1.200,00 ou 99,90
      const priceMatch = bodyText.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
      
      if (priceMatch) {
        // Converte de "1.200,90" para "1200.90" (formato americano do banco)
        price = priceMatch[1].replace('.', '').replace(',', '.');
      }

      return res.json({
        name: title.trim(),
        description: description.trim(),
        imageUrl: image,
        price: price,
        original_link: url
      });

    } catch (error) {
      console.error('Erro no Scraper:', error.message);
      return res.status(500).json({ error: 'Não foi possível ler este site. Tente preencher manualmente.' });
    }
  }
};