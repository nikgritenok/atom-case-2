#!/bin/sh
set -e
node scripts/wait-db.js
node_modules/.bin/sequelize-cli db:migrate
node scripts/seed-if-empty.js
exec node src/server.js
