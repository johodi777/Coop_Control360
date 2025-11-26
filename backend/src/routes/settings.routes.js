const express = require('express');
const router = express.Router();
const settingsCtrl = require('../controllers/settings.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const auditLog = require('../middleware/audit.middleware');

// Rutas generales
router.get('/', verifyToken, settingsCtrl.getAll);
router.get('/key/:key', verifyToken, settingsCtrl.getByKey);
router.post('/', verifyToken, auditLog('UPDATE_SETTING', 'settings'), settingsCtrl.upsert);
router.put('/:key', verifyToken, auditLog('UPDATE_SETTING', 'settings'), settingsCtrl.upsert);
router.delete('/:key', verifyToken, auditLog('DELETE_SETTING', 'settings', { severity: 'warning' }), settingsCtrl.delete);

// Rutas específicas para auxiliares
router.get('/assistants', verifyToken, settingsCtrl.getAssistants);
router.put('/assistants', verifyToken, auditLog('UPDATE_ASSISTANTS', 'settings'), settingsCtrl.updateAssistants);

module.exports = router;

