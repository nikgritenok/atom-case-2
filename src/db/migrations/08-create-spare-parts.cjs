'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('spare_parts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.sequelize.query(
      'ALTER TABLE spare_parts ADD CONSTRAINT ck_spare_parts_stock CHECK (stock >= 0)'
    );
    await queryInterface.createTable('request_spare_parts', {
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      spare_part_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'spare_parts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE request_spare_parts ADD CONSTRAINT ck_request_spare_parts_qty CHECK (qty > 0 AND qty <= 1000)'
    );
  },
  async down(queryInterface) {
    await queryInterface.dropTable('request_spare_parts');
    await queryInterface.dropTable('spare_parts');
  },
};
