module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER },
    transactionNumber: { type: DataTypes.STRING(100), unique: true },
    paymentMethod: { type: DataTypes.ENUM('efectivo', 'transferencia', 'nequi', 'daviplata', 'payu', 'mercadopago', 'otro'), allowNull: false },
    paymentGateway: { type: DataTypes.STRING(50) }, // PayU, MercadoPago, etc.
    gatewayTransactionId: { type: DataTypes.STRING(200) },
    reference: { type: DataTypes.STRING(200) },
    status: { type: DataTypes.ENUM('procesando', 'exitoso', 'fallido', 'reembolsado'), defaultValue: 'procesando' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'COP' },
    processedBy: { type: DataTypes.INTEGER }, // User ID
    processedAt: { type: DataTypes.DATE },
    errorMessage: { type: DataTypes.TEXT },
    metadata: { type: DataTypes.JSON } // Para almacenar datos adicionales de la pasarela
  }, { tableName: 'transactions', timestamps: true });
  return Transaction;
};
