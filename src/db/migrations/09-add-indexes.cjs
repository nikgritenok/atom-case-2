'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS pg_trgm'
    );
    await queryInterface.addIndex('equipment', ['serial_number'], {
      name: 'uq_equipment_serial_active',
      unique: true,
      where: { deleted_at: null },
    });
    await queryInterface.addIndex('equipment', ['site_id'], {
      name: 'idx_equipment_site',
    });
    await queryInterface.addIndex(
      'maintenance_requests',
      ['equipment_id', 'status'],
      {
        name: 'idx_requests_equipment_status',
      }
    );
    await queryInterface.addIndex(
      'maintenance_requests',
      ['status', 'priority'],
      {
        name: 'idx_requests_status_priority',
      }
    );
    await queryInterface.addIndex(
      'request_status_history',
      ['request_id', 'created_at'],
      {
        name: 'idx_history_request_created',
      }
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_equipment_name_trgm ON equipment USING gin (name gin_trgm_ops)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_requests_title_trgm ON maintenance_requests USING gin (title gin_trgm_ops)'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_requests_title_trgm'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_equipment_name_trgm'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_history_request_created'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_requests_status_priority'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_requests_equipment_status'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_equipment_site'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS uq_equipment_serial_active'
    );
  },
};
