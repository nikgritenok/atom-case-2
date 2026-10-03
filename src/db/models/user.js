import { DataTypes } from 'sequelize';

export function initUser(sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
      },
      role: {
        type: DataTypes.ENUM('viewer', 'technician', 'admin'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'technician_id',
      },
      refreshTokenHash: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'refresh_token_hash',
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
    }
  );

  return User;
}
