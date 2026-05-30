import Fastify from 'fastify';

import { prisma } from './db.js';
import { registerRoutes } from './routes.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  registerRoutes(app);

  return app;
}
