module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(50), unique: true },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.ENUM('salud', 'auxilio', 'poliza', 'funerario', 'educativo', 'recreativo', 'otro', 'plan'), allowNull: false },
    requirements: { type: DataTypes.TEXT },
    maxAmount: { type: DataTypes.DECIMAL(12, 2) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    requiresApproval: { type: DataTypes.BOOLEAN, defaultValue: true },
    minAffiliationMonths: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxRequestsPerYear: { type: DataTypes.INTEGER },
    // Campos adicionales para planes de servicios
    pricing: { type: DataTypes.JSON, allowNull: true }, // Precios por año y nivel de riesgo
    pricingData: { type: DataTypes.TEXT, allowNull: true }, // Alias para compatibilidad
    planType: { type: DataTypes.STRING(50), allowNull: true }, // Tipo de plan (plan_vital, plan_basico, etc.)
    benefits: { type: DataTypes.JSON, allowNull: true } // Array de beneficios del plan
  }, { tableName: 'services', timestamps: true });
  return Service;
};
