const db = require('../models');
const { Op } = require('sequelize');
const logger = require('./logger');

/**
 * Script para resetear transacciones antiguas
 * Elimina todas las transacciones anteriores a la fecha actual
 * Esto permite empezar a registrar datos reales desde hoy
 */
async function resetOldTransactions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día de hoy

    logger.info('Iniciando limpieza de transacciones antiguas...');
    logger.info(`Fecha de corte: ${today.toISOString()}`);

    // Contar transacciones que se van a eliminar
    const countToDelete = await db.Transaction.count({
      where: {
        createdAt: {
          [Op.lt]: today
        }
      }
    });

    logger.info(`Transacciones a eliminar: ${countToDelete}`);

    if (countToDelete === 0) {
      logger.info('No hay transacciones antiguas para eliminar');
      return {
        success: true,
        deleted: 0,
        message: 'No hay transacciones antiguas para eliminar'
      };
    }

    // Eliminar transacciones antiguas
    const deleted = await db.Transaction.destroy({
      where: {
        createdAt: {
          [Op.lt]: today
        }
      }
    });

    logger.info(`✓ ${deleted} transacciones eliminadas exitosamente`);

    // También limpiar facturas antiguas relacionadas (opcional)
    const oldInvoices = await db.Invoice.count({
      where: {
        createdAt: {
          [Op.lt]: today
        }
      }
    });

    logger.info(`Facturas antiguas encontradas: ${oldInvoices} (no se eliminan automáticamente)`);

    return {
      success: true,
      deleted,
      message: `Se eliminaron ${deleted} transacciones anteriores a ${today.toLocaleDateString('es-CO')}`
    };
  } catch (error) {
    logger.error('Error al resetear transacciones:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  resetOldTransactions()
    .then(result => {
      console.log('\n=== Resumen ===');
      console.log(`✓ ${result.message}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetOldTransactions };

