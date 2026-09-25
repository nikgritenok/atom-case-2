'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_requests_priority AS ENUM ('low', 'medium', 'high', 'critical')"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_requests_status AS ENUM ('new', 'in_progress', 'done', 'rejected')"
    );
    await queryInterface.createTable('maintenance_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      priority: {
        type: 'enum_requests_priority',
        allowNull: false,
      },
      status: {
        type: 'enum_requests_status',
        allowNull: false,
        defaultValue: 'new',
      },
      planned_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      author: {
        type: Sequelize.STRING,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_requests');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS enum_requests_status'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS enum_requests_priority'
    );
  },
};
