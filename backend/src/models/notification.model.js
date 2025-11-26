module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER },
    affiliateId: { type: DataTypes.INTEGER },
    type: { type: DataTypes.ENUM('email', 'sms', 'push', 'whatsapp', 'system'), allowNull: false },
    channel: { type: DataTypes.STRING(50) }, // Canal específico si aplica
    subject: { type: DataTypes.STRING(255) },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'), defaultValue: 'pending' },
    sentAt: { type: DataTypes.DATE },
    readAt: { type: DataTypes.DATE },
    metadata: { type: DataTypes.JSON }, // Datos adicionales
    errorMessage: { type: DataTypes.TEXT },
    priority: { type: DataTypes.ENUM('low', 'normal', 'high'), defaultValue: 'normal' }
  }, { tableName: 'notifications', timestamps: true });
  return Notification;
};

