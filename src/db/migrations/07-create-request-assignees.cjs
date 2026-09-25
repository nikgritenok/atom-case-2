'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_assignees_role AS ENUM ('lead', 'member')"
    );
    await queryInterface.createTable('request_assignees', {
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'technicians', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      role: {
        type: 'enum_assignees_role',
        allowNull: false,
      },
      hours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE request_assignees ADD CONSTRAINT ck_request_assignees_hours CHECK (hours >= 0 AND hours <= 1000)'
    );
  },
  async down(queryInterface) {
    await queryInterface.dropTable('request_assignees');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS enum_assignees_role'
    );
  },
};
