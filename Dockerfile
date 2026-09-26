FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY .sequelizerc ./
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
