module.exports = (sequelize, DataTypes) => {
  const Cooperative = sequelize.define('Cooperative', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    legalName: { type: DataTypes.STRING(255) },
    nit: { type: DataTypes.STRING(50), unique: true },
    address: { type: DataTypes.STRING(255) },
    city: { type: DataTypes.STRING(100) },
    department: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(120) },
    website: { type: DataTypes.STRING(255) },
    logo: { type: DataTypes.STRING(500) },
    settings: { type: DataTypes.JSON }, // Configuraciones generales
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'cooperatives', timestamps: true });
  return Cooperative;
};
