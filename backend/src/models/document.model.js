module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    affiliateId: { type: DataTypes.INTEGER },
    serviceRequestId: { type: DataTypes.INTEGER },
    pqrsId: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM('cedula', 'certificado', 'factura', 'comprobante', 'otro'), allowNull: false },
    category: { type: DataTypes.STRING(100) },
    fileUrl: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.INTEGER }, // En bytes
    mimeType: { type: DataTypes.STRING(100) },
    uploadedBy: { type: DataTypes.INTEGER }, // User ID
    description: { type: DataTypes.TEXT },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verifiedBy: { type: DataTypes.INTEGER },
    verifiedAt: { type: DataTypes.DATE }
  }, { tableName: 'documents', timestamps: true });
  return Document;
};

