import Fastify from 'fastify';
import cors from '@fastify/cors';

import { prisma } from './db.js';
import { env } from './env.js';
import { registerRoutes } from './routes.js';

export function buildApp() {
  const app = Fastify({ logger: true });
  const configuredOrigins = env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];

  void app.register(cors, {
    origin(origin, callback) {
      // Native requests have no Origin header; browser origins stay restricted.
      if (!origin || configuredOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  registerRoutes(app);

  return app;
}
