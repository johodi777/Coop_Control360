const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { userSchema, loginSchema } = require('../utils/validators');

router.post('/register', validate(userSchema), authCtrl.register);
router.post('/login', validate(loginSchema), authCtrl.login);
router.post('/logout', verifyToken, authCtrl.logout); // Logout opcional (puede ser sin token también)

// Rutas protegidas
router.get('/profile', verifyToken, authCtrl.getProfile);
router.get('/me', verifyToken, authCtrl.getProfile); // Alias para /profile
router.put('/profile', verifyToken, authCtrl.updateProfile);
router.put('/change-password', verifyToken, authCtrl.changePassword);

module.exports = router;
