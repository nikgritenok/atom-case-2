'use strict';

const { Op } = require('sequelize');

const uuid = (n) => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`;
const R = (n) => uuid(40 + n);
const T = (n) => uuid(10 + n);

const rows = [
  { request_id: R(1), technician_id: T(1), role: 'lead', hours: 2 },
  { request_id: R(1), technician_id: T(4), role: 'member', hours: 2 },
  { request_id: R(2), technician_id: T(1), role: 'lead', hours: 5 },
  { request_id: R(2), technician_id: T(2), role: 'member', hours: 3 },
  { request_id: R(4), technician_id: T(1), role: 'lead', hours: 3 },
  { request_id: R(4), technician_id: T(5), role: 'member', hours: 4 },
  { request_id: R(5), technician_id: T(1), role: 'lead', hours: 4 },
  { request_id: R(5), technician_id: T(3), role: 'member', hours: 4 },
  { request_id: R(7), technician_id: T(1), role: 'lead', hours: 4 },
  { request_id: R(7), technician_id: T(2), role: 'member', hours: 2 },
  { request_id: R(8), technician_id: T(1), role: 'lead', hours: 6 },
  { request_id: R(8), technician_id: T(4), role: 'member', hours: 2 },
  { request_id: R(11), technician_id: T(1), role: 'lead', hours: 3 },
  { request_id: R(11), technician_id: T(5), role: 'member', hours: 3 },
  { request_id: R(14), technician_id: T(1), role: 'lead', hours: 8 },
  { request_id: R(14), technician_id: T(2), role: 'member', hours: 5 },
  { request_id: R(18), technician_id: T(1), role: 'lead', hours: 2 },
  { request_id: R(18), technician_id: T(3), role: 'member', hours: 6 },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('request_assignees', rows, {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'request_assignees',
      { request_id: { [Op.in]: rows.map((r) => r.request_id) } },
      {}
    );
  },
};
