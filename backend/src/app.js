require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/affiliates', require('./routes/affiliates.routes'));
app.use('/api/beneficiaries', require('./routes/beneficiaries.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/pqrs', require('./routes/pqrs.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handler (debe ir al final)
app.use(errorHandler);

const port = process.env.PORT || 4000;
const Seeders = require('./utils/seeders');

// Sincronizar sin alterar tablas existentes para evitar errores de índices
// Usar { alter: false } para no modificar tablas existentes
db.sequelize.sync({ alter: false })
  .then(async () => {
    logger.info('Database synced');
    
    // Ejecutar seeders si está en modo desarrollo o si se especifica
    if (process.env.NODE_ENV !== 'production' || process.env.RUN_SEEDERS === 'true') {
      try {
        await Seeders.runAll();
      } catch (err) {
        logger.error('Error ejecutando seeders:', err);
      }
    }
    
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      
      // Iniciar tareas programadas
      const { startMonthlyPaymentReset } = require('./services/paymentReset.service');
      startMonthlyPaymentReset();
    });
  })
  .catch(err => {
    logger.error('Unable to connect to DB:', err);
    // En caso de error, intentar continuar sin sincronizar (para desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Continuando sin sincronización de base de datos...');
      app.listen(port, () => logger.info(`Server running on port ${port} (sin sincronización)`));
    }
  });
