const db = require('../models');
const logger = require('../utils/logger');

const auditLog = (action, module, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Registrar después de que la respuesta se envíe
      setImmediate(async () => {
        try {
          const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
          const userAgent = req.headers['user-agent'];
          
          let entityType = options.entityType || null;
          let entityId = options.entityId || null;
          let affiliateId = options.affiliateId || null;
          
          // Intentar extraer entityId de los parámetros, body o respuesta
          if (!entityId) {
            entityId = req.params.id || req.body.id || null;
          }
          // Si no hay entityId pero hay data en la respuesta con id, usarlo
          if (!entityId && data && data.data && data.data.id) {
            entityId = data.data.id;
          }
          
          // Intentar extraer affiliateId
          if (!affiliateId && req.body.affiliateId) {
            affiliateId = req.body.affiliateId;
          }
          if (!affiliateId && req.params.affiliateId) {
            affiliateId = req.params.affiliateId;
          }
          // Si no hay affiliateId pero hay data en la respuesta con affiliateId, usarlo
          if (!affiliateId && data && data.data && data.data.affiliateId) {
            affiliateId = data.data.affiliateId;
          }

          // Determinar severidad basado en el método HTTP
          let severity = 'info';
          if (req.method === 'DELETE') severity = 'warning';
          if (req.method === 'POST' && module === 'auth') severity = 'info';
          if (res.statusCode >= 400) severity = 'error';
          if (res.statusCode >= 500) severity = 'critical';

          await db.AuditLog.create({
            userId: req.user?.id || null,
            affiliateId: affiliateId,
            action: action || `${req.method} ${req.path}`,
            module: module || req.path.split('/')[2] || 'unknown',
            description: options.description || `${req.method} ${req.path}`,
            ipAddress: ipAddress,
            userAgent: userAgent,
            entityType: entityType,
            entityId: entityId,
            severity: severity
          });
        } catch (err) {
          logger.error('Error creating audit log:', err);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = auditLog;

