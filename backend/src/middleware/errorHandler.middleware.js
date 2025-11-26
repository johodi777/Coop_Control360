const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log detallado del error
  console.error('=== ERROR DETECTADO ===');
  console.error('Mensaje:', err.message);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Name:', err.name);
  if (err.original) {
    console.error('Error Original:', err.original.message);
    console.error('SQL:', err.original.sql);
  }
  console.error('======================');
  
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    name: err.name,
    original: err.original?.message
  });

  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }

  // Error de duplicado
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe',
      field: err.errors[0]?.path
    });
  }

  // Error de foreign key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida en los datos'
    });
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data })
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
};

module.exports = errorHandler;

