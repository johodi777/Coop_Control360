const express = require('express');
const router = express.Router();
const reportsCtrl = require('../controllers/reports.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/financial', verifyToken, isAdmin, reportsCtrl.financialReport);
router.get('/affiliates', verifyToken, isAdmin, reportsCtrl.affiliatesReport);
router.get('/services', verifyToken, isAdmin, reportsCtrl.servicesReport);
router.get('/dashboard', verifyToken, reportsCtrl.dashboard);

module.exports = router;

