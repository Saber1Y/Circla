FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

COPY seed/circles.json ./seed/circles.json
RUN mkdir -p /app/data

ENV NODE_ENV=production

EXPOSE 8080

# Render injects its own PORT at runtime, so probe the actual listening port.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" || exit 1

CMD ["sh", "/app/entrypoint.sh", "node", "/app/src/index.mjs"]