const express = require('express');
const router = express.Router();
const affCtrl = require('../controllers/affiliates.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { affiliateSchema } = require('../utils/validators');
const auditLog = require('../middleware/audit.middleware');

router.post('/', 
  verifyToken, 
  validate(affiliateSchema), 
  auditLog('CREATE_AFFILIATE', 'affiliates'),
  affCtrl.create
);

router.get('/', 
  verifyToken, 
  affCtrl.list
);

router.get('/:id', 
  verifyToken, 
  affCtrl.get
);

router.get('/:id/contributions', 
  verifyToken, 
  affCtrl.getContributionHistory
);

router.put('/:id', 
  verifyToken, 
  validate(affiliateSchema), 
  auditLog('UPDATE_AFFILIATE', 'affiliates'),
  affCtrl.update
);

router.delete('/:id', 
  verifyToken, 
  auditLog('DELETE_AFFILIATE', 'affiliates', { severity: 'warning' }),
  affCtrl.delete
);

router.post('/import/excel', 
  verifyToken, 
  affCtrl.importExcel
);

router.post('/reset-monthly-payments', 
  verifyToken, 
  auditLog('RESET_MONTHLY_PAYMENTS', 'affiliates', { severity: 'warning' }),
  affCtrl.resetMonthlyPayments
);

module.exports = router;
