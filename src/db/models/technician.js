import { DataTypes } from 'sequelize';

export function initTechnician(sequelize) {
  const Technician = sequelize.define(
    'Technician',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'full_name',
      },
      spec: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tabNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'tab_number',
      },
    },
    {
      tableName: 'technicians',
      underscored: true,
      timestamps: true,
    }
  );

  return Technician;
}
