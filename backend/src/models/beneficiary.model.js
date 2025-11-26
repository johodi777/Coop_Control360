module.exports = (sequelize, DataTypes) => {
  const Beneficiary = sequelize.define('Beneficiary', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER, allowNull: false },
    firstName: { type: DataTypes.STRING(150), allowNull: false },
    lastName: { type: DataTypes.STRING(150), allowNull: false },
    documentType: { type: DataTypes.ENUM('CC', 'CE', 'TI', 'PASAPORTE'), allowNull: false },
    documentNumber: { type: DataTypes.STRING(50), allowNull: false },
    relationship: { type: DataTypes.ENUM('conyuge', 'hijo', 'hija', 'padre', 'madre', 'otro'), allowNull: false },
    birthDate: { type: DataTypes.DATE },
    gender: { type: DataTypes.ENUM('M', 'F', 'OTRO') },
    phone: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(255) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 } // Porcentaje de beneficio
  }, { tableName: 'beneficiaries', timestamps: true });
  return Beneficiary;
};

