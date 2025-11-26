/*
 Simple migration runner - NOTE: for production use proper migration tool.
 This script syncs models to DB (alter: true).
*/
require('dotenv').config();
const db = require('../models');
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Migrations applied (sync alter).');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration error', err);
    process.exit(1);
  });
