const express = require('express');
const router = express.Router();
const audit = require('../controllers/audit.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyToken, isAdmin, audit.list);

module.exports = router;
