'use strict';

const NOW = new Date('2025-06-01T00:00:00.000Z');

const ROWS = [
  {
    id: '11111111-1111-4111-8111-000000000001',
    name: 'Северная',
    code: 'NORD',
    region: 'Север',
    lat: 60.0,
    lon: 30.0,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000002',
    name: 'Южная',
    code: 'SOUTH',
    region: 'Юг',
    lat: 45.0,
    lon: 38.0,
    created_at: NOW,
    updated_at: NOW,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('sites', ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sites', {
      id: ROWS.map((r) => r.id),
    });
  },
};
