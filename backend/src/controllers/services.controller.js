const db = require('../models');
const logger = require('../utils/logger');
const Service = db.Service;

// Listar todos los servicios
exports.list = async (req, res, next) => {
  try {
    const list = await Service.findAll({
      order: [['name', 'ASC']]
    });
    res.json(list);
  } catch (err) {
    logger.error('Error listando servicios:', err);
    next(err);
  }
};

// Obtener servicio por ID
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    res.json(service);
  } catch (err) {
    logger.error('Error obteniendo servicio:', err);
    next(err);
  }
};

// Obtener servicio por código
exports.getByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const service = await Service.findOne({ where: { code } });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (err) {
    logger.error('Error obteniendo servicio por código:', err);
    next(err);
  }
};

// Crear servicio
exports.create = async (req, res, next) => {
  try {
    // Preparar datos, asegurando que pricing y benefits sean JSON válidos
    const serviceData = {
      ...req.body,
      pricing: req.body.pricing ? (typeof req.body.pricing === 'string' ? JSON.parse(req.body.pricing) : req.body.pricing) : null,
      benefits: req.body.benefits ? (typeof req.body.benefits === 'string' ? JSON.parse(req.body.benefits) : req.body.benefits) : null,
      pricingData: req.body.pricing ? JSON.stringify(req.body.pricing) : null // Mantener compatibilidad
    };
    
    const service = await Service.create(serviceData);
    logger.info(`Servicio creado: ${service.code} por usuario ${req.user?.id}`);
    res.status(201).json(service);
  } catch (err) {
    logger.error('Error creando servicio:', err);
    next(err);
  }
};

// Actualizar servicio
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    // Preparar datos, asegurando que pricing y benefits sean JSON válidos
    const updateData = {
      ...req.body,
      pricing: req.body.pricing ? (typeof req.body.pricing === 'string' ? JSON.parse(req.body.pricing) : req.body.pricing) : service.pricing,
      benefits: req.body.benefits ? (typeof req.body.benefits === 'string' ? JSON.parse(req.body.benefits) : req.body.benefits) : service.benefits,
      pricingData: req.body.pricing ? JSON.stringify(req.body.pricing) : service.pricingData // Mantener compatibilidad
    };
    
    await service.update(updateData);
    logger.info(`Servicio actualizado: ${id} por usuario ${req.user?.id}`);
    
    const updated = await Service.findByPk(id);
    res.json(updated);
  } catch (err) {
    logger.error('Error actualizando servicio:', err);
    next(err);
  }
};

// Eliminar servicio
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    await service.destroy();
    logger.info(`Servicio eliminado: ${id} por usuario ${req.user?.id}`);
    
    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente'
    });
  } catch (err) {
    logger.error('Error eliminando servicio:', err);
    next(err);
  }
};
