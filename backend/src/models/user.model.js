module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50) },
    documentNumber: { type: DataTypes.STRING(50) },
    position: { type: DataTypes.STRING(100) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE },
    passwordChangedAt: { type: DataTypes.DATE },
    resetPasswordToken: { type: DataTypes.STRING(255) },
    resetPasswordExpires: { type: DataTypes.DATE }
  }, { tableName: 'users', timestamps: true });
  return User;
};
