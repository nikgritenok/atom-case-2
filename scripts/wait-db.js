import sequelize from '../src/db/sequelize.js';

const attempts = 30;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await sequelize.authenticate();
    process.exit(0);
  } catch {
    if (attempt === attempts) {
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
