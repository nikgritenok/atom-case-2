FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY openapi/ ./openapi/
COPY .sequelizerc ./

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=base --chown=app:app /app/package*.json ./
COPY --from=base --chown=app:app /app/node_modules ./node_modules
COPY --from=base --chown=app:app /app/src ./src
COPY --from=base --chown=app:app /app/scripts ./scripts
COPY --from=base --chown=app:app /app/openapi ./openapi
COPY --from=base --chown=app:app /app/.sequelizerc ./
USER app
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health/live || exit 1
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
