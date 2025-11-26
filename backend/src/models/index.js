const { Sequelize } = require('sequelize');
require('dotenv').config();

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

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = require('./role.model')(sequelize, Sequelize.DataTypes);
db.User = require('./user.model')(sequelize, Sequelize.DataTypes);
db.Affiliate = require('./affiliate.model')(sequelize, Sequelize.DataTypes);
db.Cooperative = require('./cooperative.model')(sequelize, Sequelize.DataTypes);
db.Service = require('./service.model')(sequelize, Sequelize.DataTypes);
db.ServiceRequest = require('./serviceRequest.model')(sequelize, Sequelize.DataTypes);
db.Invoice = require('./invoice.model')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./transaction.model')(sequelize, Sequelize.DataTypes);
db.Pqrs = require('./pqrs.model')(sequelize, Sequelize.DataTypes);
db.PqrsResponse = require('./pqrsResponse.model')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./audit.model')(sequelize, Sequelize.DataTypes);
db.Beneficiary = require('./beneficiary.model')(sequelize, Sequelize.DataTypes);
db.Document = require('./document.model')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notification.model')(sequelize, Sequelize.DataTypes);
db.PaymentGateway = require('./paymentGateway.model')(sequelize, Sequelize.DataTypes);
db.Report = require('./report.model')(sequelize, Sequelize.DataTypes);
db.Setting = require('./setting.model')(sequelize, Sequelize.DataTypes);

// relations
db.Role.hasMany(db.User, { foreignKey: 'roleId' });
db.User.belongsTo(db.Role, { foreignKey: 'roleId' });

db.Cooperative.hasMany(db.Affiliate, { foreignKey: 'cooperativeId' });
db.Affiliate.belongsTo(db.Cooperative, { foreignKey: 'cooperativeId' });

db.User.hasMany(db.Affiliate, { foreignKey: 'registeredBy', as: 'RegisteredAffiliates' });
db.Affiliate.belongsTo(db.User, { foreignKey: 'registeredBy', as: 'RegisteredBy' });

db.Affiliate.hasMany(db.Invoice, { foreignKey: 'affiliateId' });
db.Invoice.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });

db.Invoice.hasMany(db.Transaction, { foreignKey: 'invoiceId' });
db.Transaction.belongsTo(db.Invoice, { foreignKey: 'invoiceId' });

db.Service.hasMany(db.ServiceRequest, { foreignKey: 'serviceId' });
db.ServiceRequest.belongsTo(db.Service, { foreignKey: 'serviceId' });

db.Affiliate.hasMany(db.Pqrs, { foreignKey: 'affiliateId' });
db.Pqrs.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });

db.Pqrs.hasMany(db.PqrsResponse, { foreignKey: 'pqrsId' });
db.PqrsResponse.belongsTo(db.Pqrs, { foreignKey: 'pqrsId' });

db.User.hasMany(db.AuditLog, { foreignKey: 'userId' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId' });

// Beneficiarios
db.Affiliate.hasMany(db.Beneficiary, { foreignKey: 'affiliateId' });
db.Beneficiary.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });

// Documentos
db.Affiliate.hasMany(db.Document, { foreignKey: 'affiliateId' });
db.Document.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });
db.ServiceRequest.hasMany(db.Document, { foreignKey: 'serviceRequestId' });
db.Document.belongsTo(db.ServiceRequest, { foreignKey: 'serviceRequestId' });
db.Pqrs.hasMany(db.Document, { foreignKey: 'pqrsId' });
db.Document.belongsTo(db.Pqrs, { foreignKey: 'pqrsId' });
db.User.hasMany(db.Document, { foreignKey: 'uploadedBy', as: 'UploadedDocuments' });
db.Document.belongsTo(db.User, { foreignKey: 'uploadedBy', as: 'UploadedBy' });
db.User.hasMany(db.Document, { foreignKey: 'verifiedBy', as: 'VerifiedDocuments' });
db.Document.belongsTo(db.User, { foreignKey: 'verifiedBy', as: 'VerifiedBy' });

// Notificaciones
db.User.hasMany(db.Notification, { foreignKey: 'userId' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId' });
db.Affiliate.hasMany(db.Notification, { foreignKey: 'affiliateId' });
db.Notification.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });

// Transacciones
db.Affiliate.hasMany(db.Transaction, { foreignKey: 'affiliateId' });
db.Transaction.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });
db.User.hasMany(db.Transaction, { foreignKey: 'processedBy', as: 'ProcessedTransactions' });
db.Transaction.belongsTo(db.User, { foreignKey: 'processedBy', as: 'ProcessedBy' });

// Solicitudes de servicios
db.Affiliate.hasMany(db.ServiceRequest, { foreignKey: 'affiliateId' });
db.ServiceRequest.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });
db.User.hasMany(db.ServiceRequest, { foreignKey: 'reviewedBy', as: 'ReviewedServiceRequests' });
db.ServiceRequest.belongsTo(db.User, { foreignKey: 'reviewedBy', as: 'ReviewedBy' });

// PQRS
db.User.hasMany(db.Pqrs, { foreignKey: 'assignedTo', as: 'AssignedPqrs' });
db.Pqrs.belongsTo(db.User, { foreignKey: 'assignedTo', as: 'AssignedTo' });
db.User.hasMany(db.PqrsResponse, { foreignKey: 'userId' });
db.PqrsResponse.belongsTo(db.User, { foreignKey: 'userId' });

// Reportes
db.User.hasMany(db.Report, { foreignKey: 'generatedBy' });
db.Report.belongsTo(db.User, { foreignKey: 'generatedBy' });

// Auditoría
db.Affiliate.hasMany(db.AuditLog, { foreignKey: 'affiliateId' });
db.AuditLog.belongsTo(db.Affiliate, { foreignKey: 'affiliateId' });

module.exports = db;
