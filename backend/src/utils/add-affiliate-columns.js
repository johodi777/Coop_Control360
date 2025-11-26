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
    console.log('Conexión exitosa.');

    // Verificar qué columnas existen
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'affiliates'
    `);
    
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas existentes:', columnNames.join(', '));

    // Agregar columnas si no existen
    const columnsToAdd = [
      { name: 'assistantId', type: 'VARCHAR(50)', after: 'totalContributions' },
      { name: 'businessName', type: 'VARCHAR(255)', after: 'assistantId' },
      { name: 'paymentStatus', type: 'VARCHAR(50)', after: 'businessName' }
    ];

    for (const col of columnsToAdd) {
      if (columnNames.includes(col.name)) {
        console.log(`✓ Columna '${col.name}' ya existe, omitiendo...`);
      } else {
        try {
          const query = `ALTER TABLE affiliates ADD COLUMN ${col.name} ${col.type} NULL AFTER ${col.after}`;
          await sequelize.query(query);
          console.log(`✓ Columna '${col.name}' agregada exitosamente`);
        } catch (error) {
          if (error.message.includes('Duplicate column name')) {
            console.log(`✓ Columna '${col.name}' ya existe`);
          } else {
            console.error(`✗ Error agregando columna '${col.name}':`, error.message);
          }
        }
      }
    }

    console.log('\n✅ Proceso completado. Las columnas están listas.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addColumns();

