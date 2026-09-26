import { DataTypes } from 'sequelize';

export function initRequestSparePart(sequelize) {
  const RequestSparePart = sequelize.define(
    'RequestSparePart',
    {
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'request_id',
      },
      sparePartId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'spare_part_id',
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'request_spare_parts',
      underscored: true,
      timestamps: false,
    }
  );

  return RequestSparePart;
}
