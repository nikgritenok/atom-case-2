'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');

module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) return;
    const passwordHash = await bcrypt.hash(password, 12);
    const [rows] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      { replacements: { email } }
    );
    if (rows.length > 0) return;
    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        email,
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL;
    if (!email) return;
    await queryInterface.bulkDelete('users', { email });
  },
};
