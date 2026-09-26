'use strict';

const { Op } = require('sequelize');

const uuid = (n) => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`;
const R = (n) => uuid(40 + n);
const P = (n) => uuid(30 + n);

const rows = [
  { request_id: R(2), spare_part_id: P(1), qty: 3 },
  { request_id: R(2), spare_part_id: P(2), qty: 2 },
  { request_id: R(5), spare_part_id: P(3), qty: 5 },
  { request_id: R(5), spare_part_id: P(4), qty: 2 },
  { request_id: R(6), spare_part_id: P(1), qty: 2 },
  { request_id: R(12), spare_part_id: P(2), qty: 4 },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('request_spare_parts', rows, {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'request_spare_parts',
      {
        [Op.or]: rows.map((r) => ({
          request_id: r.request_id,
          spare_part_id: r.spare_part_id,
        })),
      },
      {}
    );
  },
};
