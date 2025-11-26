const express = require('express');
const router = express.Router();
const beneficiariesCtrl = require('../controllers/beneficiaries.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { beneficiarySchema } = require('../utils/validators');
const auditLog = require('../middleware/audit.middleware');

// Beneficiarios de un afiliado específico
router.post('/affiliate/:affiliateId', 
  verifyToken, 
  validate(beneficiarySchema), 
  auditLog('CREATE_BENEFICIARY', 'beneficiaries'),
  beneficiariesCtrl.create
);

router.get('/affiliate/:affiliateId', 
  verifyToken, 
  beneficiariesCtrl.list
);

router.get('/:id', 
  verifyToken, 
  beneficiariesCtrl.get
);

router.put('/:id', 
  verifyToken, 
  validate(beneficiarySchema), 
  auditLog('UPDATE_BENEFICIARY', 'beneficiaries'),
  beneficiariesCtrl.update
);

router.delete('/:id', 
  verifyToken, 
  auditLog('DELETE_BENEFICIARY', 'beneficiaries'),
  beneficiariesCtrl.delete
);

module.exports = router;

