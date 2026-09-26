import { DataTypes } from 'sequelize';

export function initRequestStatusHistory(sequelize) {
  const RequestStatusHistory = sequelize.define(
    'RequestStatusHistory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'request_id',
      },
      fromStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'from_status',
      },
      toStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'to_status',
      },
      author: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'request_status_history',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  return RequestStatusHistory;
}
