'use strict';

const NOW = new Date('2025-06-01T00:00:00.000Z');

const SITE_NORD = '11111111-1111-4111-8111-000000000001';
const SITE_SOUTH = '11111111-1111-4111-8111-000000000002';

const EQUIPMENT = [
  {
    id: '11111111-1111-4111-8111-000000000021',
    site_id: SITE_NORD,
    name: 'Турбина Северная-1',
    type: 'turbine',
    serial_number: 'SN-S-001',
    lat: 60.1,
    lon: 30.2,
    status: 'operational',
    installed_at: new Date('2023-01-10T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000022',
    site_id: SITE_NORD,
    name: 'Инвертор Северный-2',
    type: 'inverter',
    serial_number: 'SN-S-002',
    lat: 60.2,
    lon: 30.3,
    status: 'maintenance',
    installed_at: new Date('2023-03-15T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000023',
    site_id: SITE_SOUTH,
    name: 'Датчик Южный-1',
    type: 'sensor',
    serial_number: 'SN-J-001',
    lat: 45.1,
    lon: 38.1,
    status: 'operational',
    installed_at: new Date('2023-06-01T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000024',
    site_id: SITE_SOUTH,
    name: 'Подстанция Южная-1',
    type: 'substation',
    serial_number: 'SN-J-002',
    lat: 45.2,
    lon: 38.2,
    status: 'fault',
    installed_at: new Date('2022-11-20T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000025',
    site_id: null,
    name: 'Турбина Резервная',
    type: 'turbine',
    serial_number: 'SN-R-001',
    lat: 55.0,
    lon: 37.0,
    status: 'decommissioned',
    installed_at: new Date('2021-05-05T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000026',
    site_id: null,
    name: 'Датчик Полевой',
    type: 'sensor',
    serial_number: 'SN-F-001',
    lat: 56.0,
    lon: 37.5,
    status: 'operational',
    installed_at: new Date('2024-02-01T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  },
];

const PASSPORTS = [
  {
    id: '11111111-1111-4111-8111-000000000021',
    equipment_id: '11111111-1111-4111-8111-000000000021',
    manufacturer: 'Северный завод',
    model: 'WT-3000',
    power_kw: 3000,
    last_check_at: new Date('2025-01-15T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000022',
    equipment_id: '11111111-1111-4111-8111-000000000022',
    manufacturer: 'Вольт',
    model: 'INV-500',
    power_kw: 500,
    last_check_at: new Date('2025-02-10T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000023',
    equipment_id: '11111111-1111-4111-8111-000000000023',
    manufacturer: 'ДатчикПрибор',
    model: 'SEN-10',
    power_kw: 0.5,
    last_check_at: new Date('2025-03-01T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000024',
    equipment_id: '11111111-1111-4111-8111-000000000024',
    manufacturer: 'ЭнергоСеть',
    model: 'SUB-110',
    power_kw: 11000,
    last_check_at: new Date('2024-12-20T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: '11111111-1111-4111-8111-000000000025',
    equipment_id: '11111111-1111-4111-8111-000000000025',
    manufacturer: 'Северный завод',
    model: 'WT-1500',
    power_kw: 1500,
    last_check_at: new Date('2024-06-30T00:00:00.000Z'),
    created_at: NOW,
    updated_at: NOW,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('equipment', EQUIPMENT);
    await queryInterface.bulkInsert('equipment_passports', PASSPORTS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment_passports', {
      id: PASSPORTS.map((r) => r.id),
    });
    await queryInterface.bulkDelete('equipment', {
      id: EQUIPMENT.map((r) => r.id),
    });
  },
};
