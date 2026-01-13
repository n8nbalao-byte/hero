const multer = require('multer');
const path = require('path');

module.exports = {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'uploads'),
    filename: (req, file, cb) => {
      // Cria um nome único: data-nomeoriginal.jpg (ex: 1730055-logo.png)
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${Date.now()}-${name}${ext}`);
    },
  }),
};