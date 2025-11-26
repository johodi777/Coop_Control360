/**
 * Script de migración de datos de cliente
 * Exporta todos los datos de una cooperativa específica a una nueva base de datos
 * 
 * Uso: node scripts/migrate-client-data.js <cooperativeId> <newDbName>
 * Ejemplo: node scripts/migrate-client-data.js 5 clienteA_db
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const COOPERATIVE_ID = process.argv[2];
const NEW_DB_NAME = process.argv[3];

if (!COOPERATIVE_ID || !NEW_DB_NAME) {
  console.error('Uso: node scripts/migrate-client-data.js <cooperativeId> <newDbName>');
  process.exit(1);
}

// Configuración de la base de datos original
const sourceConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'coop',
  password: process.env.DB_PASS || 'secret',
  database: process.env.DB_NAME || 'coopcontrol',
  port: process.env.DB_PORT || 3306
};

// Configuración de la nueva base de datos (mismo servidor, diferente nombre)
const targetConfig = {
  ...sourceConfig,
  database: NEW_DB_NAME
};

// Tablas que tienen relación con cooperativeId (directa o indirecta)
const TABLES_TO_MIGRATE = [
  'cooperatives', // Solo la cooperativa específica
  'users', // Usuarios asociados (si tienen cooperativeId, sino todos)
  'affiliates', // Filtrado por cooperativeId
  'invoices', // A través de affiliates
  'transactions', // A través de affiliates/invoices
  'service_requests', // A través de affiliates
  'pqrs', // A través de affiliates
  'pqrs_responses', // A través de pqrs
  'beneficiaries', // A través de affiliates
  'documents', // A través de affiliates/service_requests/pqrs
  'notifications', // A través de affiliates/users
  'audit_logs', // A través de affiliates/users
  'reports', // A través de users
  'settings', // Configuraciones generales
  'roles', // Roles del sistema
  'services', // Servicios (si tienen cooperativeId)
  'payment_gateways' // Pasarelas de pago
];

async function createDatabase(connection) {
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${NEW_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✓ Base de datos ${NEW_DB_NAME} creada`);
  } catch (error) {
    console.error('Error creando base de datos:', error.message);
    throw error;
  }
}

async function getTableStructure(connection, tableName) {
  try {
    const [rows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    return rows[0]['Create Table'];
  } catch (error) {
    console.warn(`No se pudo obtener estructura de ${tableName}:`, error.message);
    return null;
  }
}

async function copyTableStructure(sourceConn, targetConn, tableName) {
  try {
    const createTableSQL = await getTableStructure(sourceConn, tableName);
    if (!createTableSQL) return false;

    // Reemplazar el nombre de la BD en el CREATE TABLE
    const modifiedSQL = createTableSQL.replace(
      new RegExp(`\`${sourceConfig.database}\``, 'g'),
      `\`${NEW_DB_NAME}\``
    );

    await targetConn.query(modifiedSQL);
    console.log(`✓ Estructura de ${tableName} copiada`);
    return true;
  } catch (error) {
    console.warn(`Error copiando estructura de ${tableName}:`, error.message);
    return false;
  }
}

async function migrateCooperative(sourceConn, targetConn) {
  try {
    const [rows] = await sourceConn.query(
      'SELECT * FROM cooperatives WHERE id = ?',
      [COOPERATIVE_ID]
    );

    if (rows.length === 0) {
      throw new Error(`No se encontró la cooperativa con ID ${COOPERATIVE_ID}`);
    }

    const cooperative = rows[0];
    const columns = Object.keys(cooperative);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => cooperative[col]);

    await targetConn.query(
      `INSERT INTO cooperatives (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    console.log(`✓ Cooperativa ${cooperative.name} migrada`);
    return cooperative;
  } catch (error) {
    console.error('Error migrando cooperativa:', error.message);
    throw error;
  }
}

async function migrateAffiliates(sourceConn, targetConn) {
  try {
    const [rows] = await sourceConn.query(
      'SELECT * FROM affiliates WHERE cooperativeId = ?',
      [COOPERATIVE_ID]
    );

    if (rows.length === 0) {
      console.log('⚠ No hay afiliados para migrar');
      return [];
    }

    const affiliateIds = [];
    for (const affiliate of rows) {
      const columns = Object.keys(affiliate);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => affiliate[col]);

      await targetConn.query(
        `INSERT INTO affiliates (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      affiliateIds.push(affiliate.id);
    }

    console.log(`✓ ${rows.length} afiliados migrados`);
    return affiliateIds;
  } catch (error) {
    console.error('Error migrando afiliados:', error.message);
    throw error;
  }
}

async function migrateRelatedData(sourceConn, targetConn, tableName, whereClause, params = []) {
  try {
    const [rows] = await sourceConn.query(
      `SELECT * FROM ${tableName} WHERE ${whereClause}`,
      params
    );

    if (rows.length === 0) {
      return 0;
    }

    for (const row of rows) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => row[col]);

      try {
        await targetConn.query(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      } catch (error) {
        // Ignorar errores de duplicados
        if (!error.message.includes('Duplicate entry')) {
          console.warn(`Error insertando en ${tableName}:`, error.message);
        }
      }
    }

    console.log(`✓ ${rows.length} registros de ${tableName} migrados`);
    return rows.length;
  } catch (error) {
    if (error.message.includes("doesn't exist")) {
      console.log(`⚠ Tabla ${tableName} no existe, omitiendo`);
      return 0;
    }
    console.error(`Error migrando ${tableName}:`, error.message);
    return 0;
  }
}

async function migrateUsers(sourceConn, targetConn) {
  // Migrar todos los usuarios (asumiendo que todos pueden acceder a esta cooperativa)
  // En un sistema real, podrías tener una tabla de relación user_cooperative
  return await migrateRelatedData(sourceConn, targetConn, 'users', '1=1');
}

async function migrateRoles(sourceConn, targetConn) {
  return await migrateRelatedData(sourceConn, targetConn, 'roles', '1=1');
}

async function migrateServices(sourceConn, targetConn) {
  // Si services tiene cooperativeId, filtrar. Si no, migrar todos
  try {
    const [columns] = await sourceConn.query(
      `SHOW COLUMNS FROM services LIKE 'cooperativeId'`
    );
    
    if (columns.length > 0) {
      return await migrateRelatedData(sourceConn, targetConn, 'services', 'cooperativeId = ?', [COOPERATIVE_ID]);
    } else {
      return await migrateRelatedData(sourceConn, targetConn, 'services', '1=1');
    }
  } catch (error) {
    return await migrateRelatedData(sourceConn, targetConn, 'services', '1=1');
  }
}

async function main() {
  let sourceConn, targetConn;

  try {
    console.log('🚀 Iniciando migración de datos...');
    console.log(`Cooperativa ID: ${COOPERATIVE_ID}`);
    console.log(`Nueva BD: ${NEW_DB_NAME}`);

    // Conectar a BD original
    sourceConn = await mysql.createConnection(sourceConfig);
    console.log('✓ Conectado a base de datos original');

    // Crear nueva BD
    await createDatabase(sourceConn);

    // Conectar a nueva BD
    targetConn = await mysql.createConnection(targetConfig);
    console.log('✓ Conectado a nueva base de datos');

    // Copiar estructuras de todas las tablas
    console.log('\n📋 Copiando estructuras de tablas...');
    for (const table of TABLES_TO_MIGRATE) {
      await copyTableStructure(sourceConn, targetConn, table);
    }

    // Migrar datos
    console.log('\n📦 Migrando datos...');

    // 1. Roles primero (necesarios para usuarios)
    await migrateRoles(sourceConn, targetConn);

    // 2. Cooperativa
    const cooperative = await migrateCooperative(sourceConn, targetConn);

    // 3. Usuarios
    await migrateUsers(sourceConn, targetConn);

    // 4. Servicios
    await migrateServices(sourceConn, targetConn);

    // 5. Afiliados
    const affiliateIds = await migrateAffiliates(sourceConn, targetConn);

    if (affiliateIds.length > 0) {
      // 6. Datos relacionados con afiliados
      const affiliateIdsStr = affiliateIds.join(',');
      
      await migrateRelatedData(sourceConn, targetConn, 'invoices', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'transactions', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'service_requests', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'pqrs', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'beneficiaries', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'documents', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'notifications', `affiliateId IN (${affiliateIdsStr})`);
      await migrateRelatedData(sourceConn, targetConn, 'audit_logs', `affiliateId IN (${affiliateIdsStr})`);
    }

    // 7. PQRS Responses (a través de PQRS)
    const [pqrsRows] = await sourceConn.query(
      `SELECT id FROM pqrs WHERE affiliateId IN (SELECT id FROM affiliates WHERE cooperativeId = ?)`,
      [COOPERATIVE_ID]
    );
    if (pqrsRows.length > 0) {
      const pqrsIds = pqrsRows.map(r => r.id).join(',');
      await migrateRelatedData(sourceConn, targetConn, 'pqrs_responses', `pqrsId IN (${pqrsIds})`);
    }

    // 8. Documentos relacionados con service_requests y pqrs
    if (affiliateIds.length > 0) {
      const affiliateIdsStr = affiliateIds.join(',');
      await migrateRelatedData(sourceConn, targetConn, 'documents', 
        `(serviceRequestId IN (SELECT id FROM service_requests WHERE affiliateId IN (${affiliateIdsStr})) OR pqrsId IN (SELECT id FROM pqrs WHERE affiliateId IN (${affiliateIdsStr})))`);
    }

    // 9. Transacciones relacionadas con invoices
    if (affiliateIds.length > 0) {
      const affiliateIdsStr = affiliateIds.join(',');
      await migrateRelatedData(sourceConn, targetConn, 'transactions',
        `invoiceId IN (SELECT id FROM invoices WHERE affiliateId IN (${affiliateIdsStr}))`);
    }

    // 10. Notificaciones de usuarios
    await migrateRelatedData(sourceConn, targetConn, 'notifications', 'affiliateId IS NULL');

    // 11. Reportes
    await migrateRelatedData(sourceConn, targetConn, 'reports', '1=1');

    // 12. Settings
    await migrateRelatedData(sourceConn, targetConn, 'settings', '1=1');

    // 13. Payment Gateways
    await migrateRelatedData(sourceConn, targetConn, 'payment_gateways', '1=1');

    console.log('\n✅ Migración completada exitosamente!');
    console.log(`\n📝 Resumen:`);
    console.log(`   - Base de datos: ${NEW_DB_NAME}`);
    console.log(`   - Cooperativa: ${cooperative.name}`);
    console.log(`   - Siguiente paso: Configurar .env y desplegar`);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

main();

