const db = require('../models');
const logger = require('../utils/logger');

const Setting = db.Setting;

// Obtener todas las configuraciones
exports.getAll = async (req, res, next) => {
  try {
    const settings = await Setting.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Convertir a objeto clave-valor para facilitar el acceso
    // Con DataTypes.JSON, Sequelize ya parsea automáticamente, pero mantenemos compatibilidad
    const settingsObj = {};
    settings.forEach(setting => {
      try {
        // Si ya es un objeto (DataTypes.JSON), usarlo directamente
        // Si es string (compatibilidad con datos antiguos), parsearlo
        settingsObj[setting.key] = typeof setting.value === 'string' 
          ? JSON.parse(setting.value) 
          : setting.value;
      } catch (e) {
        settingsObj[setting.key] = setting.value;
      }
    });

    res.json({
      success: true,
      data: settingsObj,
      raw: settings
    });
  } catch (err) {
    next(err);
  }
};

// Obtener configuración por clave
exports.getByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ where: { key, isActive: true } });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    // Con DataTypes.JSON, Sequelize ya parsea automáticamente
    const value = typeof setting.value === 'string' 
      ? (() => { try { return JSON.parse(setting.value); } catch(e) { return setting.value; } })()
      : setting.value;

    res.json({
      success: true,
      data: { key: setting.key, value, description: setting.description, category: setting.category }
    });
  } catch (err) {
    next(err);
  }
};

// Crear o actualizar configuración
exports.upsert = async (req, res, next) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'La clave es requerida'
      });
    }

    // Con DataTypes.JSON, Sequelize maneja la serialización automáticamente
    // Pero mantenemos compatibilidad con strings
    const valueToSave = typeof value === 'object' ? value : String(value);

    const [setting, created] = await Setting.upsert({
      key,
      value: valueToSave,
      description: description || null,
      category: category || 'general',
      isActive: true
    }, {
      returning: true
    });

    logger.info(`Configuración ${created ? 'creada' : 'actualizada'}: ${key} por usuario ${req.user.id}`);

    // Con DataTypes.JSON, Sequelize ya parsea automáticamente
    const parsedValue = typeof setting.value === 'string' 
      ? (() => { try { return JSON.parse(setting.value); } catch(e) { return setting.value; } })()
      : setting.value;

    res.json({
      success: true,
      message: `Configuración ${created ? 'creada' : 'actualizada'} exitosamente`,
      data: {
        key: setting.key,
        value: parsedValue,
        description: setting.description,
        category: setting.category
      }
    });
  } catch (err) {
    next(err);
  }
};

// Eliminar configuración (soft delete)
exports.delete = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ where: { key } });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    await setting.update({ isActive: false });

    logger.info(`Configuración eliminada: ${key} por usuario ${req.user.id}`);

    res.json({
      success: true,
      message: 'Configuración eliminada exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

// Obtener auxiliares específicamente
exports.getAssistants = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ 
      where: { key: 'assistants', isActive: true } 
    });

    if (!setting) {
      // Retornar valores por defecto si no existe
      const defaultAssistants = [
        { id: "natalia", name: "Natalia", color: "blue" },
        { id: "lina", name: "Lina", color: "green" }
      ];
      return res.json({
        success: true,
        data: defaultAssistants
      });
    }

    // Con DataTypes.JSON, Sequelize ya parsea automáticamente
    let assistants;
    if (typeof setting.value === 'string') {
      try {
        assistants = JSON.parse(setting.value);
      } catch (e) {
        assistants = [];
      }
    } else {
      assistants = setting.value || [];
    }

    res.json({
      success: true,
      data: Array.isArray(assistants) ? assistants : []
    });
  } catch (err) {
    next(err);
  }
};

// Actualizar auxiliares
exports.updateAssistants = async (req, res, next) => {
  try {
    const { assistants } = req.body;

    if (!Array.isArray(assistants)) {
      return res.status(400).json({
        success: false,
        message: 'Los auxiliares deben ser un array'
      });
    }

    // Validar estructura de cada auxiliar
    for (const assistant of assistants) {
      if (!assistant.id || !assistant.name) {
        return res.status(400).json({
          success: false,
          message: 'Cada auxiliar debe tener id y name'
        });
      }
    }

    // Con DataTypes.JSON, Sequelize maneja la serialización automáticamente
    const [setting] = await Setting.upsert({
      key: 'assistants',
      value: assistants, // Sequelize serializa automáticamente con DataTypes.JSON
      description: 'Lista de auxiliares del sistema',
      category: 'assistants',
      isActive: true
    }, {
      returning: true
    });

    logger.info(`Auxiliares actualizados por usuario ${req.user.id}`);

    res.json({
      success: true,
      message: 'Auxiliares actualizados exitosamente',
      data: assistants
    });
  } catch (err) {
    next(err);
  }
};

