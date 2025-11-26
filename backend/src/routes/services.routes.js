const express = require('express');
const router = express.Router();
const svc = require('../controllers/services.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Rutas GET (las más específicas primero)
router.get('/code/:code', verifyToken, svc.getByCode);
router.get('/', verifyToken, svc.list); // Debe ir antes de /:id
router.get('/:id', verifyToken, svc.getById);

// Rutas protegidas (requieren admin)
router.post('/', verifyToken, isAdmin, svc.create);
router.put('/:id', verifyToken, isAdmin, svc.update);
router.delete('/:id', verifyToken, isAdmin, svc.delete);

module.exports = router;
