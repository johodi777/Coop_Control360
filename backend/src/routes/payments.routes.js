const express = require('express');
const router = express.Router();
const pay = require('../controllers/payments.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const auditLog = require('../middleware/audit.middleware');

router.post('/invoices', 
  verifyToken, 
  auditLog('CREATE_INVOICE', 'payments', { entityType: 'invoice' }),
  pay.createInvoice
);
router.post('/transactions', 
  verifyToken, 
  auditLog('CREATE_TRANSACTION', 'payments', { entityType: 'transaction' }),
  pay.createTransaction
);
router.get('/transactions', verifyToken, pay.listTransactions);
router.get('/transactions/:id', 
  verifyToken, 
  auditLog('VIEW_TRANSACTION', 'payments', { entityType: 'transaction' }),
  pay.getTransaction
);

module.exports = router;
