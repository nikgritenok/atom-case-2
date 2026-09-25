const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      site_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'sites',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('turbine', 'inverter', 'sensor', 'substation'),
        allowNull: false,
      },
      serial_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      lon: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'operational',
          'maintenance',
          'fault',
          'decommissioned'
        ),
        allowNull: false,
        defaultValue: 'operational',
      },
      installed_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipment');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_equipment_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_equipment_status";'
    );
  },
};
