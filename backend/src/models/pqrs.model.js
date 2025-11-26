module.exports = (sequelize, DataTypes) => {
  const Pqrs = sequelize.define('Pqrs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER, allowNull: false },
    pqrsNumber: { type: DataTypes.STRING(50), unique: true },
    type: { type: DataTypes.ENUM('peticion', 'queja', 'reclamo', 'sugerencia'), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('abierto', 'en_proceso', 'cerrado', 'resuelto'), defaultValue: 'abierto' },
    priority: { type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'), defaultValue: 'media' },
    assignedTo: { type: DataTypes.INTEGER }, // User ID
    openedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE },
    responseDeadline: { type: DataTypes.DATE },
    attachments: { type: DataTypes.JSON }, // Array de URLs de archivos
    tags: { type: DataTypes.JSON } // Array de tags para categorización
  }, { tableName: 'pqrs', timestamps: true });
  return Pqrs;
};
