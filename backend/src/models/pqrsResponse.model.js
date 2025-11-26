module.exports = (sequelize, DataTypes) => {
  const PqrsResponse = sequelize.define('PqrsResponse', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    pqrsId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    response: { type: DataTypes.TEXT, allowNull: false },
    isInternal: { type: DataTypes.BOOLEAN, defaultValue: false }, // Nota interna o respuesta al afiliado
    attachments: { type: DataTypes.JSON }
  }, { tableName: 'pqrs_responses', timestamps: true });
  return PqrsResponse;
};
