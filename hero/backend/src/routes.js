const express = require('express');
const multer = require('multer'); // <--- Importar
const uploadConfig = require('./config/upload'); // <--- Importar config
const AiController = require('./controllers/AiController');
const db = require('./database');
const StoreController = require('./controllers/StoreController');
const ProductController = require('./controllers/ProductController');
const AuthController = require('./controllers/AuthController');
const OrderController = require('./controllers/OrderController');
const UserController = require('./controllers/UserController');
const NotificationController = require('./controllers/NotificationController');
const UploadController = require('./controllers/UploadController');
const AdminController = require('./controllers/AdminController'); // <--- Novo Controller
const SettingsController = require('./controllers/SettingsController'); // <--- Importar
const authMiddleware = require('./middleware/auth');

const routes = express.Router();
const upload = multer(uploadConfig); // <--- Inicializar Multer

// --- ROTA PÚBLICA DE TESTE ---
routes.get('/', (req, res) => {
  res.json({ message: 'Campinas Delivery API Running 🚀' });
});

// --- AUTH ---
routes.post('/register', AuthController.register);
routes.post('/login', AuthController.login);
routes.post('/login/google', AuthController.googleLogin);

// --- PÚBLICO (LOJA E PRODUTOS) ---
routes.get('/stores', StoreController.index);
routes.get('/stores/:id', StoreController.show);
routes.get('/products', ProductController.listAll); // <--- Feed Global
routes.get('/categories', ProductController.getCategories);
routes.get('/stores/:store_id/products', ProductController.index); // Listagem
routes.get('/products/:id', ProductController.show);

routes.get('/orders/:id/track', OrderController.track);
routes.get('/notifications/stream', NotificationController.stream);

// --- WEBHOOKS (PÚBLICOS) ---
routes.post('/webhooks/asaas', OrderController.asaasWebhook);

// ==================================================================
// --- PROTECTED ROUTES (Requer Login) ---
// ==================================================================
routes.use(authMiddleware);
routes.post('/ai/generate', AiController.generateDescription);
// --- ROTA DE UPLOAD (NOVO!) ---
// O frontend envia um arquivo no campo 'file', o backend devolve a URL
routes.post('/upload', upload.single('file'), UploadController.store);

// --- GESTÃO DA LOJA ---
routes.get('/my-store', StoreController.myStore);
routes.put('/my-store', StoreController.update);
routes.post('/stores', StoreController.store);

// --- GESTÃO DE PRODUTOS ---
routes.post('/stores/:store_id/products', ProductController.store);
routes.post('/stores/:store_id/products/bulk', ProductController.storeBulk); // Importação em massa
routes.put('/products/:id', ProductController.update);
routes.delete('/products/:id', ProductController.delete);

// --- VEÍCULOS ---
routes.get('/users/vehicles', UserController.getVehicles);
routes.post('/users/vehicles', UserController.addVehicle);
routes.put('/users/vehicles/:id', UserController.updateVehicle);
routes.delete('/users/vehicles/:id', UserController.deleteVehicle);

routes.put('/users/profile', UserController.updateProfile); // <--- NOVA

// --- PEDIDOS ---
routes.post('/orders', OrderController.store);
routes.get('/orders', OrderController.index);
routes.put('/orders/:id/status', OrderController.updateStatus);
routes.post('/orders/:id/confirm', OrderController.confirmDelivery); // <--- NOVA ROTA

// --- ADMIN MASTER ---
routes.get('/admin/stats', AdminController.getStats);
routes.get('/admin/logs', AdminController.getLogs);

routes.get('/admin/stores', AdminController.getStores);
routes.get('/admin/stores/:id', AdminController.getStoreDetails);

routes.get('/admin/couriers', AdminController.getCouriers);
routes.get('/admin/couriers/:id', AdminController.getCourierDetails);

routes.get('/admin/clients', AdminController.getClients);
routes.get('/admin/clients/:id', AdminController.getClientDetails);

routes.put('/settings', SettingsController.update); // <--- Configurações (Apenas Update Protegido)

// --- USUÁRIO ---
routes.put('/users/location', UserController.updateLocation);
routes.put('/users/online', async (req, res) => {
  try {
    const { is_online } = req.body;
    // users -> usuarios, is_online -> online
    await db.query('UPDATE usuarios SET online = ? WHERE id = ?', [is_online ? 1 : 0, req.userId]);
    return res.json({ is_online: !!is_online });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar status online' });
  }
});

routes.post('/withdrawals', UserController.requestWithdraw); // <--- NOVA ROTA DE SAQUE

module.exports = routes;