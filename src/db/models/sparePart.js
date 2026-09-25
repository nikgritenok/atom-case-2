import { DataTypes } from 'sequelize';

export function initSparePart(sequelize) {
  const SparePart = sequelize.define(
    'SparePart',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'spare_parts',
      underscored: true,
      timestamps: true,
    }
  );

  return SparePart;
}
