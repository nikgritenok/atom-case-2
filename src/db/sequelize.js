import { Sequelize } from 'sequelize';

import { config } from '../config/index.js';

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    define: { underscored: true },
    pool: {
      max: config.db.poolMax,
      min: config.db.poolMin,
      acquire: config.db.acquire,
      idle: config.db.idle,
    },
    logging: config.env === 'development' ? console.log : false,
  }
);

export default sequelize;
