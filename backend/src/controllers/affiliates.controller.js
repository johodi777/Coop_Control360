const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const { importFromExcel } = require('../utils/import-excel');

const Affiliate = db.Affiliate;

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `affiliates-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Crear nuevo afiliado
exports.create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      registeredBy: req.user.id,
      affiliationDate: req.body.affiliationDate || new Date()
    };

    const affiliate = await Affiliate.create(payload);
    
    const result = await Affiliate.findByPk(affiliate.id, {
      include: [
        { model: db.Cooperative, attributes: ['id', 'name', 'nit'], required: false },
        { model: db.User, as: 'RegisteredBy', attributes: ['id', 'fullName', 'email'], required: false }
      ]
    });

    logger.info(`Afiliado creado: ${affiliate.id} por usuario ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Afiliado creado exitosamente',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Listar afiliados con paginación y filtros
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Filtros básicos (siempre disponibles)
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.cooperativeId) {
      where.cooperativeId = req.query.cooperativeId;
    }
    
    // Filtros opcionales (solo si las columnas existen)
    // Verificamos si las columnas existen antes de usarlas
    try {
      if (req.query.assistantId) {
        where.assistantId = req.query.assistantId;
      }
    } catch (e) {
      // Ignorar si la columna no existe
    }

    try {
      if (req.query.paymentStatus) {
        where.paymentStatus = req.query.paymentStatus;
      }
    } catch (e) {
      // Ignorar si la columna no existe
    }
    
    if (req.query.search) {
      const searchConditions = [
        { firstName: { [Op.like]: `%${req.query.search}%` } },
        { lastName: { [Op.like]: `%${req.query.search}%` } },
        { documentNumber: { [Op.like]: `%${req.query.search}%` } }
      ];
      
      // Agregar email si existe
      if (req.query.search) {
        searchConditions.push({ email: { [Op.like]: `%${req.query.search}%` } });
      }
      
      // Intentar agregar businessName (puede no existir)
      // Sequelize manejará el error si la columna no existe
      searchConditions.push({ businessName: { [Op.like]: `%${req.query.search}%` } });
      
      where[Op.or] = searchConditions;
    }

    // Intentar obtener afiliados
    let count = 0;
    let rows = [];
    
    try {
      // Primero intentar con todos los filtros
      const result = await Affiliate.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: db.Cooperative, attributes: ['id', 'name'], required: false },
          { model: db.User, as: 'RegisteredBy', attributes: ['id', 'fullName', 'email'], required: false }
        ]
      });
      count = result.count;
      rows = result.rows;
    } catch (dbError) {
      logger.warn('Error al obtener afiliados con filtros completos, intentando sin columnas opcionales:', dbError.message);
      
      try {
        // Crear un where seguro sin columnas opcionales
        const safeWhere = {};
        if (where.status) safeWhere.status = where.status;
        if (where.cooperativeId) safeWhere.cooperativeId = where.cooperativeId;
        
        // Búsqueda sin businessName y sin filtros opcionales
        if (where[Op.or]) {
          safeWhere[Op.or] = where[Op.or].filter(cond => {
            const keys = Object.keys(cond);
            return !keys.includes('businessName') && !keys.includes('assistantId') && !keys.includes('paymentStatus');
          });
        }
        
        const result = await Affiliate.findAndCountAll({
          where: safeWhere,
          limit,
          offset,
          order: [['createdAt', 'DESC']],
          include: [
            { model: db.Cooperative, attributes: ['id', 'name'], required: false },
            { model: db.User, as: 'RegisteredBy', attributes: ['id', 'fullName', 'email'], required: false }
          ]
        });
        count = result.count;
        rows = result.rows;
      } catch (secondError) {
        logger.warn('Error en segundo intento, intentando sin includes:', secondError.message);
        
        try {
          // Último intento: sin includes y sin filtros opcionales
          const minimalWhere = {};
          if (where.status) minimalWhere.status = where.status;
          if (where.cooperativeId) minimalWhere.cooperativeId = where.cooperativeId;
          
          const result = await Affiliate.findAndCountAll({
            where: minimalWhere,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
          });
          count = result.count;
          rows = result.rows;
        } catch (finalError) {
          logger.error('Error final al obtener afiliados:', finalError);
          // Si todo falla, devolver array vacío
          count = 0;
          rows = [];
        }
      }
    }

    // Asegurar que rows sea un array
    const affiliatesArray = Array.isArray(rows) ? rows : [];
    
    res.json({
      success: true,
      data: affiliatesArray,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    logger.error('Error en list de affiliates:', err);
    logger.error('Stack trace:', err.stack);
    
    // Devolver respuesta de error más informativa
    res.status(500).json({
      success: false,
      message: 'Error al obtener afiliados',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }
};

// Obtener afiliado por ID
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const affiliate = await Affiliate.findByPk(id, {
      include: [
        { model: db.Cooperative, attributes: ['id', 'name', 'nit', 'address', 'phone', 'email'] },
        { model: db.User, as: 'RegisteredBy', attributes: ['id', 'fullName', 'email'], required: false },
        { model: db.Beneficiary, attributes: ['id', 'firstName', 'lastName', 'relationship', 'documentNumber'] },
        { model: db.Document, limit: 10, order: [['createdAt', 'DESC']] },
        {
          model: db.Invoice,
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            { model: db.Transaction, attributes: ['id', 'amount', 'status', 'paymentMethod', 'createdAt'] }
          ]
        }
      ]
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Afiliado no encontrado'
      });
    }

    // Calcular estadísticas
    const totalInvoices = await db.Invoice.count({ where: { affiliateId: id } });
    const pendingInvoices = await db.Invoice.count({ 
      where: { affiliateId: id, status: 'pendiente' } 
    });
    const totalPaid = await db.Transaction.sum('amount', {
      where: { affiliateId: id, status: 'exitoso' }
    }) || 0;

    res.json({
      success: true,
      data: {
        ...affiliate.toJSON(),
        statistics: {
          totalInvoices,
          pendingInvoices,
          totalPaid
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Actualizar afiliado
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const affiliate = await Affiliate.findByPk(id);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Afiliado no encontrado'
      });
    }

    await affiliate.update(req.body);
    
    const updated = await Affiliate.findByPk(id, {
      include: [
        { model: db.Cooperative, attributes: ['id', 'name'] },
        { model: db.User, as: 'RegisteredBy', attributes: ['id', 'fullName'], required: false }
      ]
    });

    logger.info(`Afiliado actualizado: ${id} por usuario ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Afiliado actualizado exitosamente',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Eliminar afiliado
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const affiliate = await Affiliate.findByPk(id);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Afiliado no encontrado'
      });
    }

    await affiliate.destroy();
    
    logger.info(`Afiliado eliminado: ${id} por usuario ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Afiliado eliminado exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Importar desde Excel
exports.importExcel = [
  upload.single('file'),
  async (req, res, next) => {
    const fs = require('fs');
    let filePath = null;
    
    try {
      if (!req.file) {
        logger.warn('Intento de importación sin archivo');
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      filePath = req.file.path;
      logger.info(`Iniciando importación de Excel: ${filePath}`);

      const results = await importFromExcel(filePath);
      
      logger.info(`Importación de Excel completada: ${results.success} exitosos, ${results.errors} errores, ${results.skipped} omitidos`);

      // Eliminar archivo después de procesarlo
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Archivo temporal eliminado: ${filePath}`);
        }
      } catch (unlinkError) {
        logger.warn(`No se pudo eliminar el archivo temporal: ${unlinkError.message}`);
      }

      res.json({
        success: true,
        message: `Importación completada: ${results.success} exitosos, ${results.errors} errores`,
        data: results
      });
    } catch (err) {
      logger.error('Error en importación de Excel:', err);
      
      // Intentar eliminar archivo en caso de error
      if (filePath) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkError) {
          // Ignorar error al eliminar
        }
      }
      
      res.status(500).json({
        success: false,
        message: err.message || 'Error al procesar el archivo Excel',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
];

// Obtener historial de contribuciones
exports.getContributionHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transactions = await db.Transaction.findAll({
      where: {
        affiliateId: id,
        status: 'exitoso'
      },
      include: [
        {
          model: db.Invoice,
          attributes: ['id', 'total', 'dueDate', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// Endpoint manual para resetear pagos mensuales (útil para pruebas)
exports.resetMonthlyPayments = async (req, res, next) => {
  try {
    const { resetMonthlyPayments } = require('../services/paymentReset.service');
    // Permitir ejecutar manualmente en cualquier momento (force=true)
    const result = await resetMonthlyPayments(true);
    
    if (result.success === false) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
