module.exports = (sequelize, DataTypes) => {
  const Affiliate = sequelize.define('Affiliate', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cooperativeId: { type: DataTypes.INTEGER },
    registeredBy: { type: DataTypes.INTEGER },
    firstName: { type: DataTypes.STRING(150), allowNull: false },
    lastName: { type: DataTypes.STRING(150), allowNull: false },
    documentType: { type: DataTypes.ENUM('CC', 'CE', 'NIT', 'PASAPORTE', 'TI'), allowNull: false },
    documentNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    phone: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(255) },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(100) },
    department: { type: DataTypes.STRING(100) },
    birthDate: { type: DataTypes.DATE },
    gender: { type: DataTypes.ENUM('M', 'F', 'OTRO') },
    occupation: { type: DataTypes.STRING(150) },
    status: { type: DataTypes.ENUM('activo', 'suspendido', 'moroso', 'retirado'), defaultValue: 'activo' },
    affiliationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    monthlyContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalContributions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    assistantId: { type: DataTypes.STRING(50) }, // 'natalia' o 'lina'
    businessName: { type: DataTypes.STRING(255) }, // Razón social
    paymentStatus: { type: DataTypes.STRING(50) }, // 'paid', 'pending', 'paid_payroll', 'pending_contribution', 'new', 'retired'
    notes: { type: DataTypes.TEXT }
  }, { tableName: 'affiliates', timestamps: true });
  return Affiliate;
};
