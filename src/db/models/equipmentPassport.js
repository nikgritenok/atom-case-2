import { DataTypes } from 'sequelize';

export function initEquipmentPassport(sequelize) {
  const EquipmentPassport = sequelize.define(
    'EquipmentPassport',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      equipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'equipment_id',
      },
      manufacturer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      powerKw: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'power_kw',
      },
      lastCheckAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_check_at',
      },
    },
    {
      tableName: 'equipment_passports',
      underscored: true,
      timestamps: true,
    }
  );

  return EquipmentPassport;
}
