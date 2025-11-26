module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER },
    affiliateId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING(255), allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    ipAddress: { type: DataTypes.STRING(45) },
    userAgent: { type: DataTypes.STRING(500) },
    entityType: { type: DataTypes.STRING(100) }, // Tipo de entidad afectada
    entityId: { type: DataTypes.INTEGER }, // ID de la entidad afectada
    changes: { type: DataTypes.JSON }, // Cambios realizados (antes/después)
    severity: { type: DataTypes.ENUM('info', 'warning', 'error', 'critical'), defaultValue: 'info' }
  }, { tableName: 'audit_logs', timestamps: true });
  return AuditLog;
};
