/**
 * Script de migración de archivos de cliente
 * Copia archivos relacionados con una cooperativa específica
 * 
 * Uso: node scripts/migrate-client-files.js <cooperativeId> <targetPath>
 * Ejemplo: node scripts/migrate-client-files.js 5 /var/www/clienteA/uploads
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const COOPERATIVE_ID = process.argv[2];
const TARGET_PATH = process.argv[3];

if (!COOPERATIVE_ID || !TARGET_PATH) {
  console.error('Uso: node scripts/migrate-client-files.js <cooperativeId> <targetPath>');
  process.exit(1);
}

const sourceUploadsPath = path.join(__dirname, '../../uploads');
const targetUploadsPath = TARGET_PATH;

// Configuración de BD para obtener referencias de archivos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'coop',
  password: process.env.DB_PASS || 'secret',
  database: process.env.DB_NAME || 'coopcontrol',
  port: process.env.DB_PORT || 3306
};

async function getAffiliateIds(connection) {
  const [rows] = await connection.query(
    'SELECT id FROM affiliates WHERE cooperativeId = ?',
    [COOPERATIVE_ID]
  );
  return rows.map(r => r.id);
}

async function getFileReferences(connection, affiliateIds) {
  const files = new Set();

  if (affiliateIds.length === 0) {
    return files;
  }

  const affiliateIdsStr = affiliateIds.join(',');

  // Archivos de documentos
  try {
    const [docRows] = await connection.query(
      `SELECT fileUrl FROM documents WHERE affiliateId IN (${affiliateIdsStr}) OR serviceRequestId IN (SELECT id FROM service_requests WHERE affiliateId IN (${affiliateIdsStr})) OR pqrsId IN (SELECT id FROM pqrs WHERE affiliateId IN (${affiliateIdsStr}))`
    );
    docRows.forEach(row => {
      if (row.fileUrl) files.add(row.fileUrl);
    });
  } catch (error) {
    console.warn('Error obteniendo documentos:', error.message);
  }

  // Logo de la cooperativa
  try {
    const [coopRows] = await connection.query(
      'SELECT logo FROM cooperatives WHERE id = ?',
      [COOPERATIVE_ID]
    );
    if (coopRows.length > 0 && coopRows[0].logo) {
      files.add(coopRows[0].logo);
    }
  } catch (error) {
    console.warn('Error obteniendo logo:', error.message);
  }

  return files;
}

function extractFileName(fileUrl) {
  // Extraer el nombre del archivo de la URL
  // Puede ser una ruta relativa o absoluta
  if (fileUrl.startsWith('http')) {
    return path.basename(new URL(fileUrl).pathname);
  }
  return path.basename(fileUrl);
}

function findFileInUploads(fileName) {
  // Buscar el archivo en el directorio de uploads
  // Puede estar en subdirectorios
  function searchDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = searchDir(fullPath);
          if (found) return found;
        } else if (entry.name === fileName || entry.name.includes(fileName)) {
          return fullPath;
        }
      }
    } catch (error) {
      // Ignorar errores de lectura
    }
    return null;
  }

  return searchDir(sourceUploadsPath);
}

async function copyFile(sourceFile, targetFile) {
  try {
    // Crear directorio destino si no existe
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copiar archivo
    fs.copyFileSync(sourceFile, targetFile);
    return true;
  } catch (error) {
    console.error(`Error copiando ${sourceFile}:`, error.message);
    return false;
  }
}

async function main() {
  let connection;

  try {
    console.log('🚀 Iniciando migración de archivos...');
    console.log(`Cooperativa ID: ${COOPERATIVE_ID}`);
    console.log(`Destino: ${targetUploadsPath}`);

    // Verificar que existe el directorio de uploads origen
    if (!fs.existsSync(sourceUploadsPath)) {
      console.warn(`⚠ Directorio de uploads no existe: ${sourceUploadsPath}`);
      console.log('✓ Migración de archivos completada (sin archivos para migrar)');
      return;
    }

    // Conectar a BD para obtener referencias
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado a base de datos');

    // Obtener IDs de afiliados
    const affiliateIds = await getAffiliateIds(connection);
    console.log(`✓ Encontrados ${affiliateIds.length} afiliados`);

    // Obtener referencias de archivos
    const fileReferences = await getFileReferences(connection, affiliateIds);
    console.log(`✓ Encontradas ${fileReferences.size} referencias de archivos`);

    if (fileReferences.size === 0) {
      console.log('✓ No hay archivos para migrar');
      return;
    }

    // Crear directorio destino
    if (!fs.existsSync(targetUploadsPath)) {
      fs.mkdirSync(targetUploadsPath, { recursive: true });
      console.log(`✓ Directorio destino creado: ${targetUploadsPath}`);
    }

    // Copiar archivos
    console.log('\n📁 Copiando archivos...');
    let copied = 0;
    let failed = 0;

    for (const fileUrl of fileReferences) {
      const fileName = extractFileName(fileUrl);
      const sourceFile = findFileInUploads(fileName);

      if (sourceFile) {
        const targetFile = path.join(targetUploadsPath, fileName);
        if (await copyFile(sourceFile, targetFile)) {
          copied++;
          if (copied % 10 === 0) {
            process.stdout.write(`\r   Copiados: ${copied}/${fileReferences.size}`);
          }
        } else {
          failed++;
        }
      } else {
        console.warn(`⚠ Archivo no encontrado: ${fileName}`);
        failed++;
      }
    }

    console.log(`\n✅ Migración de archivos completada!`);
    console.log(`   - Copiados: ${copied}`);
    console.log(`   - Fallidos: ${failed}`);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();

