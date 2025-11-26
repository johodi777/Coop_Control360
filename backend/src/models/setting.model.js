module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    value: { type: DataTypes.JSON, allowNull: false }, // Cambiado a JSON para mejor manejo
    description: { type: DataTypes.STRING(255) },
    category: { type: DataTypes.STRING(50), defaultValue: 'general' }, // 'general', 'assistants', 'payment', etc.
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'settings', timestamps: true });
  return Setting;
};

