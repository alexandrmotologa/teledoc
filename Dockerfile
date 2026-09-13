# Stage 1: Build Web Frontend
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY server/package*.json ./server/
RUN npm install
COPY web/ ./web/
RUN npm run build --workspace=web

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
COPY web/package*.json ./web/
COPY server/package*.json ./server/
RUN npm install
COPY server/ ./server/
RUN npm run build --workspace=server

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV STORAGE_DIR=/app/storage

# Install dumb-init for clean PID 1 signal handling
RUN apk add --no-cache dumb-init

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --omit=dev --workspace=server

COPY --from=web-builder /app/web/dist ./web/dist
COPY --from=server-builder /app/server/dist ./server/dist

RUN mkdir -p /app/storage

EXPOSE 8080

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/index.js"]
