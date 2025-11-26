const express = require('express');
const router = express.Router();
const pq = require('../controllers/pqrs.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/', verifyToken, pq.create);
router.post('/respond', verifyToken, pq.respond);

module.exports = router;
