'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_status_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      from_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      to_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
    await queryInterface.sequelize.query(
      "CREATE FUNCTION prevent_history_change() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'История статусов неизменяема'; RETURN NULL; END; $$ LANGUAGE plpgsql"
    );
    await queryInterface.sequelize.query(
      'CREATE TRIGGER history_no_change BEFORE UPDATE OR DELETE ON request_status_history FOR EACH ROW EXECUTE FUNCTION prevent_history_change()'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS history_no_change ON request_status_history'
    );
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS prevent_history_change()'
    );
    await queryInterface.dropTable('request_status_history');
  },
};
