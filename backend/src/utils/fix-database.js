/**
 * Script completo para arreglar y normalizar la base de datos
 * Elimina tablas antiguas en español y asegura que solo existan las correctas
 * Ejecutar con: node src/utils/fix-database.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'coopcontrol',
  process.env.DB_USER || 'coop',
  process.env.DB_PASS || 'secret',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false
  }
);

// Mapeo de tablas antiguas (español) a nuevas (inglés)
const tableMappings = {
  'usuarios': 'users',
  'transacciones': 'transactions',
  'afiliados': 'affiliates',
  'auditoria': 'audit_logs',
  'respuestas_pqrs': 'pqrs_responses',
  'personal_oficina': null, // Esta tabla no tiene equivalente, se eliminará
  'aportes': null, // Tabla antigua sin equivalente
  'beneficiarios': 'beneficiaries',
  'cooperativas': 'cooperatives',
  'departamentos': null, // Tabla de referencia antigua
  'documentos_afiliados': 'documents',
  'facturas': 'invoices',
  'historial_servicios': null, // Tabla antigua sin equivalente
  'metodos_pago': null, // Tabla antigua sin equivalente
  'municipios': null, // Tabla de referencia antigua
  'servicios': 'services',
  'solicitudes_servicios': 'service_requests',
};

// Tablas correctas que deben existir (según los modelos)
const correctTables = [
  'users',
  'roles',
  'affiliates',
  'cooperatives',
  'services',
  'service_requests',
  'invoices',
  'transactions',
  'pqrs',
  'pqrs_responses',
  'audit_logs',
  'beneficiaries',
  'documents',
  'notifications',
  'payment_gateways',
  'reports'
];

async function fixDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.\n');

    // 1. Listar todas las tablas actuales
    console.log('📋 Analizando tablas existentes...\n');
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME || 'coopcontrol'}'
      AND table_type = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const existingTables = tables.map(t => t.TABLE_NAME);
    console.log(`   Encontradas ${existingTables.length} tablas en la base de datos.\n`);

    // 2. Identificar tablas antiguas en español
    const oldTables = Object.keys(tableMappings);
    const tablesToRemove = [];

    for (const oldTable of oldTables) {
      if (existingTables.includes(oldTable)) {
        const newTable = tableMappings[oldTable];
        
        if (newTable && existingTables.includes(newTable)) {
          // Ambas tablas existen, verificar si hay datos en la antigua
          const [count] = await sequelize.query(
            `SELECT COUNT(*) as count FROM \`${oldTable}\``
          );
          
          if (count[0].count > 0) {
            console.log(`⚠️  Tabla ${oldTable} tiene ${count[0].count} registros.`);
            console.log(`   La tabla correcta ${newTable} ya existe.`);
            console.log(`   ⚠️  ADVERTENCIA: Se eliminará ${oldTable} sin migrar datos.`);
            console.log(`   💡 Si necesitas los datos, migra manualmente antes de continuar.\n`);
          }
          
          tablesToRemove.push(oldTable);
        } else if (newTable) {
          console.log(`⚠️  Tabla ${oldTable} existe pero ${newTable} no.`);
          console.log(`   Sequelize creará ${newTable} automáticamente al sincronizar.\n`);
          tablesToRemove.push(oldTable);
        } else {
          // No tiene equivalente, se elimina
          console.log(`🗑️  Tabla ${oldTable} no tiene equivalente en los modelos actuales.`);
          tablesToRemove.push(oldTable);
        }
      }
    }

    // 3. Eliminar foreign keys y tablas antiguas
    if (tablesToRemove.length > 0) {
      console.log('🔧 Eliminando tablas antiguas...\n');
      
      for (const tableName of tablesToRemove) {
        try {
          // Buscar foreign keys que referencian esta tabla
          const [fkResults] = await sequelize.query(`
            SELECT 
              CONSTRAINT_NAME,
              TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = '${process.env.DB_NAME || 'coopcontrol'}'
            AND REFERENCED_TABLE_NAME = '${tableName}'
          `);

          if (fkResults.length > 0) {
            console.log(`   🔓 Eliminando ${fkResults.length} foreign key(s) de ${tableName}...`);
            for (const fk of fkResults) {
              try {
                await sequelize.query(
                  `ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
                );
                console.log(`      ✅ ${fk.CONSTRAINT_NAME} eliminada de ${fk.TABLE_NAME}`);
              } catch (fkError) {
                console.log(`      ⚠️  No se pudo eliminar ${fk.CONSTRAINT_NAME}: ${fkError.message}`);
              }
            }
          }

          // Buscar foreign keys que esta tabla tiene hacia otras
          const [fkOutgoing] = await sequelize.query(`
            SELECT 
              CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'coopcontrol'}'
            AND TABLE_NAME = '${tableName}'
            AND REFERENCED_TABLE_NAME IS NOT NULL
          `);

          if (fkOutgoing.length > 0) {
            console.log(`   🔓 Eliminando ${fkOutgoing.length} foreign key(s) salientes de ${tableName}...`);
            for (const fk of fkOutgoing) {
              try {
                await sequelize.query(
                  `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
                );
                console.log(`      ✅ ${fk.CONSTRAINT_NAME} eliminada`);
              } catch (fkError) {
                console.log(`      ⚠️  No se pudo eliminar ${fk.CONSTRAINT_NAME}: ${fkError.message}`);
              }
            }
          }

          // Eliminar la tabla
          await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          console.log(`   ✅ Tabla ${tableName} eliminada exitosamente.\n`);
        } catch (error) {
          console.error(`   ❌ Error al eliminar ${tableName}:`, error.message);
          console.log(`   💡 Intenta eliminar manualmente si es necesario.\n`);
        }
      }
    } else {
      console.log('✅ No hay tablas antiguas para eliminar.\n');
    }

    // 4. Verificar tablas correctas
    console.log('✅ Verificando tablas correctas...\n');
    const [currentTables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME || 'coopcontrol'}'
      AND table_type = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const currentTableNames = currentTables.map(t => t.TABLE_NAME);
    
    console.log('📋 Tablas actuales en la base de datos:');
    currentTableNames.forEach(table => {
      const isCorrect = correctTables.includes(table);
      const icon = isCorrect ? '✅' : '⚠️';
      console.log(`   ${icon} ${table}`);
    });

    console.log('\n📋 Tablas que deberían existir (según modelos):');
    correctTables.forEach(table => {
      const exists = currentTableNames.includes(table);
      const icon = exists ? '✅' : '❌';
      console.log(`   ${icon} ${table}`);
    });

    // 5. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('='.repeat(60));
    console.log(`\n📊 Resumen:`);
    console.log(`   - Tablas eliminadas: ${tablesToRemove.length}`);
    console.log(`   - Tablas actuales: ${currentTableNames.length}`);
    console.log(`   - Tablas correctas esperadas: ${correctTables.length}`);
    console.log(`\n💡 Próximos pasos:`);
    console.log(`   1. Reinicia el backend para que Sequelize sincronice las tablas faltantes`);
    console.log(`   2. Ejecuta los seeders si es necesario: npm run dev`);
    console.log(`   3. Verifica que todas las tablas correctas se hayan creado\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar
fixDatabase();

