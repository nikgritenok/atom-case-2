'use strict';

const NOW = new Date('2025-06-01T00:00:00.000Z');

const ROWS = [
  {
    id: '11111111-1111-4111-8111-000000000011',
    full_name: 'Иван Соколов',
    spec: 'наладчик',
    tab_number: 'T-101',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000012',
    full_name: 'Петр Орлов',
    spec: 'электрик',
    tab_number: 'T-102',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000013',
    full_name: 'Анна Миронова',
    spec: 'механик',
    tab_number: 'T-103',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000014',
    full_name: 'Олег Ветров',
    spec: 'инженер',
    tab_number: 'T-104',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000015',
    full_name: 'Мария Климова',
    spec: 'техник',
    tab_number: 'T-105',
    created_at: NOW,
    updated_at: NOW,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('technicians', ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('technicians', {
      id: ROWS.map((r) => r.id),
    });
  },
};
