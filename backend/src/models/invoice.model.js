module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING(50), unique: true },
    concept: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    baseAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    paidDate: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('pendiente', 'pagado', 'anulado', 'vencido'), defaultValue: 'pendiente' },
    paymentMethod: { type: DataTypes.STRING(50) },
    reference: { type: DataTypes.STRING(200) },
    period: { type: DataTypes.STRING(20) }, // YYYY-MM para identificar el período
    isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'invoices', timestamps: true });
  return Invoice;
};
