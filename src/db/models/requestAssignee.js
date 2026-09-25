import { DataTypes } from 'sequelize';

export function initRequestAssignee(sequelize) {
  const RequestAssignee = sequelize.define(
    'RequestAssignee',
    {
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'request_id',
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'technician_id',
      },
      role: {
        type: DataTypes.ENUM('lead', 'member'),
        allowNull: false,
      },
      hours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'request_assignees',
      underscored: true,
      timestamps: false,
    }
  );

  return RequestAssignee;
}
