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

async function addColumns() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión exitosa.\n');

    // Verificar qué columnas existen
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'services'
    `);
    
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas existentes en services:', columnNames.join(', '));
    console.log('');

    // Agregar columnas si no existen
    const columnsToAdd = [
      { name: 'pricing', type: 'JSON', after: 'maxRequestsPerYear' },
      { name: 'pricingData', type: 'TEXT', after: 'pricing' },
      { name: 'planType', type: 'VARCHAR(50)', after: 'pricingData' },
      { name: 'benefits', type: 'JSON', after: 'planType' }
    ];

    for (const col of columnsToAdd) {
      if (columnNames.includes(col.name)) {
        console.log(`✓ Columna '${col.name}' ya existe, omitiendo...`);
      } else {
        try {
          // Para MySQL, JSON se maneja como JSON o LONGTEXT dependiendo de la versión
          let columnType = col.type;
          if (col.type === 'JSON') {
            // Intentar usar JSON si está disponible, sino usar LONGTEXT
            columnType = 'JSON';
          }
          
          const query = `ALTER TABLE services ADD COLUMN \`${col.name}\` ${columnType} NULL AFTER \`${col.after}\``;
          await sequelize.query(query);
          console.log(`✓ Columna '${col.name}' agregada exitosamente`);
        } catch (error) {
          if (error.message.includes('Duplicate column name')) {
            console.log(`✓ Columna '${col.name}' ya existe`);
          } else if (error.message.includes('JSON') && col.type === 'JSON') {
            // Si JSON no está disponible, usar LONGTEXT
            console.log(`⚠ JSON no disponible, usando LONGTEXT para '${col.name}'...`);
            try {
              const query = `ALTER TABLE services ADD COLUMN \`${col.name}\` LONGTEXT NULL AFTER \`${col.after}\``;
              await sequelize.query(query);
              console.log(`✓ Columna '${col.name}' agregada como LONGTEXT`);
            } catch (err2) {
              console.error(`✗ Error agregando columna '${col.name}':`, err2.message);
            }
          } else {
            console.error(`✗ Error agregando columna '${col.name}':`, error.message);
          }
        }
      }
    }

    // Actualizar el ENUM de category para incluir 'plan'
    try {
      console.log('\nActualizando ENUM de category para incluir "plan"...');
      await sequelize.query(`
        ALTER TABLE services 
        MODIFY COLUMN category ENUM('salud', 'auxilio', 'poliza', 'funerario', 'educativo', 'recreativo', 'otro', 'plan') NOT NULL
      `);
      console.log('✓ ENUM de category actualizado exitosamente');
    } catch (error) {
      if (error.message.includes('Duplicate') || error.message.includes('already exists')) {
        console.log('✓ ENUM de category ya incluye "plan"');
      } else {
        console.log(`⚠ No se pudo actualizar el ENUM (puede que ya esté actualizado): ${error.message}`);
      }
    }

    console.log('\n✅ Proceso completado. Las columnas están listas.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar
addColumns();

