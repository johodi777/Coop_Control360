/**
 * Script para ejecutar manualmente el reset mensual de pagos
 * Útil cuando el servidor no estaba corriendo el día 1 del mes
 * 
 * Uso: node scripts/execute-monthly-reset.js
 */

require('dotenv').config();
const db = require('../src/models');
const { resetMonthlyPayments } = require('../src/services/paymentReset.service');
const logger = require('../src/utils/logger');

async function main() {
  try {
    console.log('🔄 Ejecutando reset mensual de pagos...');
    console.log('');
    
    // Conectar a la base de datos
    await db.sequelize.authenticate();
    console.log('✓ Conectado a la base de datos');
    
    // Ejecutar reset con force=true para ejecutar en cualquier día
    const result = await resetMonthlyPayments(true);
    
    console.log('');
    if (result.success) {
      console.log('✅ Reset mensual ejecutado exitosamente!');
      console.log(`   - Afiliados actualizados: ${result.updated}`);
      console.log(`   - Mensaje: ${result.message}`);
    } else {
      console.log('❌ Error ejecutando reset:');
      console.log(`   - ${result.message}`);
    }
    
    console.log('');
    console.log('📝 Nota: Este script ejecuta el reset con force=true,');
    console.log('   por lo que se ejecutará independientemente del día del mes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

main();

