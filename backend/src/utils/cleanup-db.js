/**
 * Script para limpiar tablas duplicadas o antiguas de la base de datos
 * Ejecutar con: node src/utils/cleanup-db.js
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
    logging: console.log
  }
);

async function cleanupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Tablas a eliminar (versiones antiguas en español)
    const tablesToDrop = ['usuarios', 'transacciones'];

    for (const tableName of tablesToDrop) {
      try {
        // Verificar si la tabla existe
        const [results] = await sequelize.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '${process.env.DB_NAME || 'coopcontrol'}' AND table_name = '${tableName}'`
        );

        if (results[0].count > 0) {
          console.log(`🗑️  Eliminando tabla: ${tableName}`);
          
          // Buscar y eliminar foreign keys que referencian esta tabla
          const [fkResults] = await sequelize.query(`
            SELECT 
              CONSTRAINT_NAME,
              TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = '${process.env.DB_NAME || 'coopcontrol'}'
            AND REFERENCED_TABLE_NAME = '${tableName}'
          `);

          if (fkResults.length > 0) {
            console.log(`   ⚠️  Encontradas ${fkResults.length} foreign key(s) que referencian esta tabla.`);
            
            for (const fk of fkResults) {
              try {
                console.log(`   🔓 Eliminando foreign key: ${fk.CONSTRAINT_NAME} de la tabla ${fk.TABLE_NAME}`);
                await sequelize.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                console.log(`   ✅ Foreign key eliminada.`);
              } catch (fkError) {
                console.log(`   ⚠️  No se pudo eliminar la foreign key ${fk.CONSTRAINT_NAME}: ${fkError.message}`);
              }
            }
          }

          // Ahora intentar eliminar la tabla
          await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          console.log(`✅ Tabla ${tableName} eliminada exitosamente.`);
        } else {
          console.log(`ℹ️  La tabla ${tableName} no existe, omitiendo...`);
        }
      } catch (error) {
        console.error(`❌ Error al eliminar la tabla ${tableName}:`, error.message);
        console.log(`   💡 Intenta eliminar manualmente las foreign keys que la referencian.`);
      }
    }

    console.log('\n✅ Limpieza completada.');
    console.log('\n📋 Tablas correctas que deben existir:');
    console.log('   - users (no usuarios)');
    console.log('   - transactions (no transacciones)');
    console.log('   - affiliates');
    console.log('   - roles');
    console.log('   - services');
    console.log('   - pqrs');
    console.log('   - audit_logs');
    console.log('   - y otras...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar limpieza
cleanupDatabase();

