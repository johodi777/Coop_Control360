module.exports = (sequelize, DataTypes) => {
  const ServiceRequest = sequelize.define('ServiceRequest', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: false },
    requestNumber: { type: DataTypes.STRING(50), unique: true },
    state: { type: DataTypes.ENUM('pendiente', 'en_revision', 'aprobado', 'rechazado', 'finalizado', 'cancelado'), defaultValue: 'pendiente' },
    description: { type: DataTypes.TEXT, allowNull: false },
    requestedAmount: { type: DataTypes.DECIMAL(12, 2) },
    approvedAmount: { type: DataTypes.DECIMAL(12, 2) },
    reviewedBy: { type: DataTypes.INTEGER }, // User ID
    reviewedAt: { type: DataTypes.DATE },
    rejectionReason: { type: DataTypes.TEXT },
    attachments: { type: DataTypes.JSON }, // Array de URLs de archivos
    notes: { type: DataTypes.TEXT }
  }, { tableName: 'service_requests', timestamps: true });
  return ServiceRequest;
};
