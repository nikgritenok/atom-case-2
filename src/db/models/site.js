import { DataTypes } from 'sequelize';

export function initSite(sequelize) {
  const Site = sequelize.define(
    'Site',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'lat',
      },
      lon: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        field: 'lon',
      },
    },
    {
      tableName: 'sites',
      underscored: true,
      timestamps: true,
    }
  );

  return Site;
}
