const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('users', 'technician_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'technicians', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'technician_id');
  },
};
