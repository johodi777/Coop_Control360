const jwt = require('jsonwebtoken');
const db = require('../models');

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Token requerido' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token requerido' 
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Verificar que el usuario aún existe y está activo
    const user = await db.User.findByPk(payload.id, {
      include: [{ model: db.Role }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario inactivo o no encontrado' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.Role ? user.Role.name : null,
      fullName: user.fullName
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expirado' 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido' 
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.' 
  });
};

exports.isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: 'Acceso denegado. Se requieren permisos de super administrador.' 
  });
};

exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Permisos insuficientes.' 
    });
  };
};
