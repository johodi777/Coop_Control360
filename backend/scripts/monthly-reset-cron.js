#!/usr/bin/env node

/**
 * Script para ejecutar el reset mensual desde un cron job del sistema operativo
 * Este script se ejecuta independientemente de si el servidor Node.js está corriendo
 * 
 * Configurar en crontab:
 * 0 0 1 * * /usr/bin/node /ruta/al/proyecto/backend/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../src/models');
const { resetMonthlyPayments } = require('../src/services/paymentReset.service');
const logger = require('../src/utils/logger');

// Configurar logger para escribir a archivo también
const fs = require('fs');
const logPath = process.env.RESET_LOG_PATH || '/var/log/coopcontrol-reset.log';

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Error escribiendo a log:', error);
  }
}

async function main() {
  let sequelize = null;
  
  try {
    logToFile('🔄 Iniciando reset mensual de pagos (desde cron job)...');
    console.log('🔄 Iniciando reset mensual de pagos...');
    
    // Conectar a la base de datos
    sequelize = db.sequelize;
    await sequelize.authenticate();
    logToFile('✓ Conectado a la base de datos');
    console.log('✓ Conectado a la base de datos');
    
    // Ejecutar reset (sin force, para que solo se ejecute el día 1)
    const result = await resetMonthlyPayments(false);
    
    if (result.success) {
      logToFile(`✅ Reset mensual ejecutado exitosamente!`);
      logToFile(`   - Afiliados actualizados: ${result.updated}`);
      logToFile(`   - Mensaje: ${result.message}`);
      console.log('✅ Reset mensual ejecutado exitosamente!');
      console.log(`   - Afiliados actualizados: ${result.updated}`);
      console.log(`   - Mensaje: ${result.message}`);
      process.exit(0);
    } else {
      logToFile(`⚠️ Reset no ejecutado: ${result.message}`);
      console.log(`⚠️ Reset no ejecutado: ${result.message}`);
      // No es un error si no es el día 1, solo informar
      process.exit(0);
    }
    
  } catch (error) {
    const errorMsg = `❌ Error ejecutando reset mensual: ${error.message}`;
    logToFile(errorMsg);
    logToFile(error.stack);
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sequelize) {
      try {
        await sequelize.close();
      } catch (closeError) {
        logToFile(`⚠️ Error cerrando conexión: ${closeError.message}`);
      }
    }
  }
}

main();

