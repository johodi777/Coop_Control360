const db = require('../models');
const bcrypt = require('bcrypt');
const logger = require('./logger');

class Seeders {
  static async seedRoles() {
    try {
      const roles = [
        { name: 'superadmin', description: 'Super Administrador - Acceso total al sistema' },
        { name: 'admin', description: 'Administrador - Gestión completa de la cooperativa' },
        { name: 'operador', description: 'Operador - Gestión de afiliados y pagos' },
        { name: 'auditor', description: 'Auditor - Solo lectura y reportes' },
        { name: 'afiliado', description: 'Afiliado - Acceso limitado a su información' }
      ];

      for (const role of roles) {
        const [created, wasCreated] = await db.Role.findOrCreate({
          where: { name: role.name },
          defaults: role
        });
        
        if (wasCreated) {
          logger.info(`Rol creado: ${role.name}`);
        }
      }

      logger.info('Seed de roles completado');
    } catch (error) {
      logger.error('Error en seed de roles:', error);
      throw error;
    }
  }

  static async seedSuperAdmin() {
    try {
      const superAdminRole = await db.Role.findOne({ where: { name: 'superadmin' } });
      
      if (!superAdminRole) {
        throw new Error('Rol superadmin no encontrado. Ejecute seedRoles primero.');
      }

      const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      const [user, wasCreated] = await db.User.findOrCreate({
        where: { email: 'admin@coopcontrol.com' },
        defaults: {
          fullName: 'Super Administrador',
          email: 'admin@coopcontrol.com',
          passwordHash,
          roleId: superAdminRole.id,
          isActive: true
        }
      });

      if (wasCreated) {
        logger.info(`Super administrador creado: admin@coopcontrol.com / ${defaultPassword}`);
      } else {
        logger.info('Super administrador ya existe');
      }
    } catch (error) {
      logger.error('Error en seed de super admin:', error);
      throw error;
    }
  }

  static async seedCooperative() {
    try {
      const [cooperative, wasCreated] = await db.Cooperative.findOrCreate({
        where: { nit: '900000000-1' },
        defaults: {
          name: 'Cooperativa Ejemplo',
          legalName: 'Cooperativa Ejemplo S.A.',
          nit: '900000000-1',
          address: 'Calle 123 #45-67',
          city: 'Bogotá',
          department: 'Cundinamarca',
          phone: '+57 1 2345678',
          email: 'info@cooperativa.com',
          isActive: true
        }
      });

      if (wasCreated) {
        logger.info('Cooperativa de ejemplo creada');
      } else {
        logger.info('Cooperativa de ejemplo ya existe');
      }

      return cooperative;
    } catch (error) {
      logger.error('Error en seed de cooperativa:', error);
      throw error;
    }
  }

  static async seedServices() {
    try {
      const services = [
        {
          name: 'Auxilio Funerario',
          code: 'AUX-FUN',
          description: 'Auxilio para gastos funerarios',
          category: 'funerario',
          requirements: 'Mínimo 6 meses de afiliación',
          maxAmount: 5000000,
          isActive: true,
          requiresApproval: true,
          minAffiliationMonths: 6
        },
        {
          name: 'Auxilio Educativo',
          code: 'AUX-EDU',
          description: 'Auxilio para gastos educativos',
          category: 'educativo',
          requirements: 'Mínimo 12 meses de afiliación',
          maxAmount: 3000000,
          isActive: true,
          requiresApproval: true,
          minAffiliationMonths: 12
        },
        {
          name: 'Auxilio de Salud',
          code: 'AUX-SAL',
          description: 'Auxilio para gastos médicos',
          category: 'salud',
          requirements: 'Mínimo 3 meses de afiliación',
          maxAmount: 2000000,
          isActive: true,
          requiresApproval: true,
          minAffiliationMonths: 3
        },
        {
          name: 'Póliza de Vida',
          code: 'POL-VID',
          description: 'Seguro de vida para afiliados',
          category: 'poliza',
          requirements: 'Afiliado activo',
          isActive: true,
          requiresApproval: false,
          minAffiliationMonths: 0
        }
      ];

      for (const service of services) {
        const [created, wasCreated] = await db.Service.findOrCreate({
          where: { code: service.code },
          defaults: service
        });

        if (wasCreated) {
          logger.info(`Servicio creado: ${service.name}`);
        }
      }

      logger.info('Seed de servicios completado');
    } catch (error) {
      logger.error('Error en seed de servicios:', error);
      throw error;
    }
  }

  static async seedPaymentGateways() {
    try {
      const gateways = [
        {
          name: 'payu',
          isActive: false,
          testMode: true
        },
        {
          name: 'mercadopago',
          isActive: false,
          testMode: true
        },
        {
          name: 'nequi',
          isActive: false,
          testMode: false
        },
        {
          name: 'daviplata',
          isActive: false,
          testMode: false
        }
      ];

      for (const gateway of gateways) {
        const [created, wasCreated] = await db.PaymentGateway.findOrCreate({
          where: { name: gateway.name },
          defaults: gateway
        });

        if (wasCreated) {
          logger.info(`Pasarela de pago creada: ${gateway.name}`);
        }
      }

      logger.info('Seed de pasarelas de pago completado');
    } catch (error) {
      logger.error('Error en seed de pasarelas de pago:', error);
      throw error;
    }
  }

  static async runAll() {
    try {
      logger.info('Iniciando seeders...');
      
      await this.seedRoles();
      await this.seedSuperAdmin();
      await this.seedCooperative();
      await this.seedServices();
      await this.seedPaymentGateways();
      
      logger.info('Todos los seeders completados exitosamente');
    } catch (error) {
      logger.error('Error ejecutando seeders:', error);
      throw error;
    }
  }
}

module.exports = Seeders;

