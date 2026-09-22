FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src/ ./src/
COPY README.md ./
ENV PORT=3000
ENV NODE_ENV=production
ENV CORS_ORIGINS=http://localhost:3000
ENV RATE_LIMIT_WINDOW_MS=60000
ENV RATE_LIMIT_MAX=100
ENV WEATHER_API_URL=https://api.open-meteo.com/v1/forecast
ENV REQUEST_TIMEOUT_MS=5000
ENV DB_PATH=data/db.json
EXPOSE 3000
CMD ["node", "src/server.js"]
