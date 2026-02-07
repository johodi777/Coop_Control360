const cron = require('node-cron');
const db = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const Affiliate = db.Affiliate;
const Setting = db.Setting;

/**
 * Verifica si el reset mensual ya se ejecutó este mes
 */
async function hasResetRunThisMonth() {
  try {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const setting = await Setting.findOne({
      where: { key: 'last_monthly_reset' }
    });
    
    if (!setting) {
      return false;
    }
    
    return setting.value === yearMonth;
  } catch (error) {
    logger.warn('Error verificando último reset:', error);
    return false;
  }
}

/**
 * Marca que el reset mensual se ejecutó este mes
 */
async function markResetExecuted() {
  try {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    await Setting.upsert({
      key: 'last_monthly_reset',
      value: yearMonth,
      description: 'Último mes en que se ejecutó el reset mensual de pagos',
      type: 'string'
    });
  } catch (error) {
    logger.warn('Error guardando último reset:', error);
  }
}

/**
 * Actualiza el estado de pago de todos los afiliados activos a "pending" (FALTA POR PAGAR)
 * @param {boolean} force - Si es true, ejecuta sin verificar el día del mes (útil para pruebas manuales)
 */
async function resetMonthlyPayments(force = false) {
  try {
    logger.info('Iniciando actualización mensual de estados de pago...');
    
    if (!force) {
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      // Solo ejecutar si es el día 1 del mes (a menos que sea forzado)
      if (dayOfMonth !== 1) {
        logger.info(`No es el día 1 del mes (hoy es día ${dayOfMonth}). Saltando actualización.`);
        return {
          success: false,
          message: `No es el día 1 del mes. Hoy es día ${dayOfMonth}. Use force=true para ejecutar manualmente.`
        };
      }
      
      // Verificar si ya se ejecutó este mes
      const alreadyRun = await hasResetRunThisMonth();
      if (alreadyRun) {
        logger.info('El reset mensual ya se ejecutó este mes. Saltando.');
        return {
          success: false,
          message: 'El reset mensual ya se ejecutó este mes.'
        };
      }
    }

    // Actualizar afiliados activos que no estén retirados
    // No actualizar los que tienen estado "retired" (retiro) en paymentStatus o status
    const [updatedCount] = await Affiliate.update(
      { 
        paymentStatus: 'pending' 
      },
      {
        where: {
          [Op.and]: [
            { status: { [Op.ne]: 'retirado' } }, // No actualizar afiliados retirados
            { paymentStatus: { [Op.ne]: 'retired' } } // No actualizar los que tienen estado de pago "retired"
          ]
        }
      }
    );

    logger.info(`✓ Actualización mensual completada: ${updatedCount} afiliados actualizados a "FALTA POR PAGAR"`);
    
    // Marcar que se ejecutó este mes
    await markResetExecuted();
    
    // Registrar en auditoría
    try {
      await db.AuditLog.create({
        userId: null, // Sistema automático
        affiliateId: null,
        action: 'MONTHLY_PAYMENT_RESET',
        module: 'affiliates',
        description: `Actualización automática mensual: ${updatedCount} afiliados actualizados a estado "pending"`,
        ipAddress: 'system',
        userAgent: 'scheduled-task',
        entityType: 'affiliate',
        entityId: null,
        severity: 'info'
      });
    } catch (auditError) {
      logger.warn('Error registrando en auditoría:', auditError);
    }

    return {
      success: true,
      updated: updatedCount,
      message: `Se actualizaron ${updatedCount} afiliados a estado "FALTA POR PAGAR"`
    };
  } catch (error) {
    logger.error('Error en actualización mensual de pagos:', error);
    throw error;
  }
}

/**
 * Inicia el cron job para ejecutar la actualización mensual
 */
function startMonthlyPaymentReset() {
  // Ejecutar el día 1 de cada mes a las 00:00 (medianoche)
  // Formato cron: minuto hora día mes día-semana
  // '0 0 1 * *' = día 1 de cada mes a las 00:00
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Ejecutando tarea programada: Actualización mensual de estados de pago');
    try {
      await resetMonthlyPayments();
    } catch (error) {
      logger.error('Error ejecutando tarea programada de actualización mensual:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota" // Zona horaria de Colombia
  });

  logger.info('Tarea programada iniciada: Actualización mensual de estados de pago (día 1 de cada mes a las 00:00)');
  
  // Verificar si se debe ejecutar al iniciar el servidor
  // Esto es útil si el servidor se reinició después del día 1 pero aún no se ejecutó
  setTimeout(async () => {
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      // Si es el día 1, ejecutar inmediatamente
      if (dayOfMonth === 1) {
        logger.info('Es el día 1 del mes, verificando si se debe ejecutar el reset...');
        const alreadyRun = await hasResetRunThisMonth();
        if (!alreadyRun) {
          logger.info('Ejecutando actualización inmediata...');
          await resetMonthlyPayments();
        } else {
          logger.info('El reset ya se ejecutó este mes.');
        }
      } else {
        // Si no es día 1, verificar si el reset del mes anterior se ejecutó
        // Si el servidor se reinició después del día 1, podría no haberse ejecutado
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        
        const setting = await Setting.findOne({
          where: { key: 'last_monthly_reset' }
        });
        
        // Si no hay registro o el último reset fue de un mes anterior, podría no haberse ejecutado
        if (!setting || setting.value !== lastMonthStr) {
          logger.warn(`⚠️ ADVERTENCIA: No se detectó ejecución del reset mensual para el mes anterior (${lastMonthStr}).`);
          logger.warn('Si el servidor no estaba corriendo el día 1, el reset no se ejecutó automáticamente.');
          logger.warn('Puedes ejecutar el reset manualmente usando el endpoint: POST /api/affiliates/reset-monthly-payments');
        }
      }
    } catch (error) {
      logger.error('Error verificando estado del reset mensual:', error);
    }
  }, 10000); // Esperar 10 segundos después de iniciar el servidor
}

module.exports = {
  resetMonthlyPayments,
  startMonthlyPaymentReset
};

