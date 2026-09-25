'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment_passports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'equipment', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      manufacturer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      power_kw: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      last_check_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('equipment_passports');
  },
};
