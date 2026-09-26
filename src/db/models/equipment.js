import { DataTypes } from 'sequelize';

export function initEquipment(sequelize) {
  const Equipment = sequelize.define(
    'Equipment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      siteId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'site_id',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('turbine', 'inverter', 'sensor', 'substation'),
        allowNull: false,
      },
      serialNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'serial_number',
      },
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'lat',
      },
      lon: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        field: 'lon',
      },
      status: {
        type: DataTypes.ENUM(
          'operational',
          'maintenance',
          'fault',
          'decommissioned'
        ),
        allowNull: false,
        defaultValue: 'operational',
      },
      installedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'installed_at',
      },
    },
    {
      tableName: 'equipment',
      underscored: true,
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    }
  );

  return Equipment;
}
