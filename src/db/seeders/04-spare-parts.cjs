'use strict';

const NOW = new Date('2025-06-01T00:00:00.000Z');

const ROWS = [
  {
    id: '11111111-1111-4111-8111-000000000031',
    name: 'Фильтр воздушный',
    sku: 'SKU-FLT-01',
    stock: 55,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000032',
    name: 'Масло редукторное',
    sku: 'SKU-OIL-02',
    stock: 34,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000033',
    name: 'Предохранитель',
    sku: 'SKU-FUS-03',
    stock: 115,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000034',
    name: 'Датчик запасной',
    sku: 'SKU-SEN-04',
    stock: 13,
    created_at: NOW,
    updated_at: NOW,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('spare_parts', ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('spare_parts', {
      id: ROWS.map((r) => r.id),
    });
  },
};
