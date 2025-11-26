module.exports = (sequelize, DataTypes) => {
  const PaymentGateway = sequelize.define('PaymentGateway', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.ENUM('payu', 'mercadopago', 'nequi', 'daviplata', 'otro'), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    apiKey: { type: DataTypes.STRING(500) }, // Encriptado
    apiSecret: { type: DataTypes.STRING(500) }, // Encriptado
    merchantId: { type: DataTypes.STRING(200) },
    accountId: { type: DataTypes.STRING(200) },
    testMode: { type: DataTypes.BOOLEAN, defaultValue: true },
    settings: { type: DataTypes.JSON }, // Configuraciones adicionales
    webhookUrl: { type: DataTypes.STRING(500) }
  }, { tableName: 'payment_gateways', timestamps: true });
  return PaymentGateway;
};

