module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM('financial', 'affiliates', 'services', 'pqrs', 'custom'), allowNull: false },
    generatedBy: { type: DataTypes.INTEGER, allowNull: false }, // User ID
    parameters: { type: DataTypes.JSON }, // Parámetros usados para generar el reporte
    fileUrl: { type: DataTypes.STRING(500) },
    format: { type: DataTypes.ENUM('pdf', 'excel', 'csv'), allowNull: false },
    status: { type: DataTypes.ENUM('generating', 'completed', 'failed'), defaultValue: 'generating' },
    generatedAt: { type: DataTypes.DATE },
    errorMessage: { type: DataTypes.TEXT },
    fileSize: { type: DataTypes.INTEGER }
  }, { tableName: 'reports', timestamps: true });
  return Report;
};

