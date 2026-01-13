module.exports = {
  async store(req, res) {
    // Se o arquivo não vier, retorna erro
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Retorna a URL pronta para o Frontend usar
    // Ex: http://localhost:3000/uploads/12345-foto.jpg
    const { filename } = req.file;
    
    // Melhora: Usa o host da requisição atual em vez de env fixa, 
    // garantindo que funcione tanto local (localhost) quanto prod (dominio)
    const protocol = req.protocol;
    const host = req.get('host'); 
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;

    return res.json({ url: fileUrl });
  }
};