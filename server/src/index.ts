import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { tempStore } from './storage/tempStore.js';
import { botManager } from './bot/bot.js';
import { scanApiRoutes } from './routes/scanApi.js';
import { exportApiRoutes } from './routes/exportApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = fastify({
    logger: true,
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Multipart file uploads (limit 35MB for high-res mobile photos)
  await app.register(multipart, {
    limits: {
      fileSize: 35 * 1024 * 1024,
    },
  });

  // Healthcheck endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      demoMode: config.demoMode,
      timestamp: new Date().toISOString(),
    };
  });

  // Register API routes
  await app.register(scanApiRoutes);
  await app.register(exportApiRoutes);

  // Serve compiled Mini App frontend if available
  const distPath = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(distPath)) {
    await app.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });

    // SPA client-side routing fallback
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url && request.raw.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'Endpoint not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    app.log.warn(`Frontend build directory not found at ${distPath}. Running in API-only mode.`);
  }

  // Initialize storage directory
  await tempStore.init();

  // Schedule hourly storage cleanup
  const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
  setInterval(() => {
    tempStore.cleanExpiredFiles().then((cleaned: number) => {
      if (cleaned > 0) {
        app.log.info(`Cleaned ${cleaned} expired temporary files.`);
      }
    });
  }, CLEANUP_INTERVAL_MS);

  // Start Telegram bot long polling in background
  botManager.start().catch((err) => {
    app.log.error('Bot polling error:', err);
  });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}. Shutting down TeleDoc gracefully...`);
      await botManager.stop();
      await app.close();
      process.exit(0);
    });
  }

  try {
    await app.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`\n======================================================`);
    console.log(`TeleDoc Server is listening on http://${config.host}:${config.port}`);
    console.log(`Demo mode: ${config.demoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`======================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
