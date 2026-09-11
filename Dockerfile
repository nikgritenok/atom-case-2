FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src/ ./src/
COPY README.md ./
ENV GEOCODING_BASE_URL=https://geocoding-api.open-meteo.com/v1/search
ENV FORECAST_BASE_URL=https://api.open-meteo.com/v1/forecast
ENV REQUEST_TIMEOUT_MS=5000
ENV REPORTS_DIR=reports
ENTRYPOINT ["node", "src/index.js"]
CMD ["--help"]
