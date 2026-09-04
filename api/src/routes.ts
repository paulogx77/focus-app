import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { prisma } from './db.js';
import { credentialsSchema, registerSchema, syncRequestSchema } from './schemas.js';

const scrypt = promisify(scryptCallback);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

async function issueSession(user: { id: string; name: string }, tx = prisma) {
  const token = randomBytes(32).toString('base64url');
  await tx.accessToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_DURATION_MS) } });
  return { token, user: { syncId: user.id, name: user.name, provider: 'local' as const } };
}

async function requireUserId(request: { headers: { authorization?: string } }, reply: { code: (statusCode: number) => { send: (payload: unknown) => unknown } }) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return reply.code(401).send({ message: 'Authentication required' });

  const session = await prisma.accessToken.findFirst({
    where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  if (!session) return reply.code(401).send({ message: 'Invalid session' });
  return session.userId;
}

export function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.post('/v1/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid registration data', issues: parsed.error.flatten() });

    const existing = await prisma.credential.findUnique({ where: { username: parsed.data.username } });
    if (existing) return reply.code(409).send({ message: 'Username already exists' });

    const user = await prisma.remoteUser.create({
      data: {
        id: randomUUID(),
        name: parsed.data.name,
        provider: 'local',
        credentials: { create: { username: parsed.data.username, passwordHash: await hashPassword(parsed.data.password) } },
      },
    });
    return reply.code(201).send(await issueSession(user));
  });

  app.post('/v1/auth/login', async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Invalid login data' });

    const credential = await prisma.credential.findUnique({ where: { username: parsed.data.username }, include: { user: true } });
    if (!credential || !(await verifyPassword(parsed.data.password, credential.passwordHash))) {
      return reply.code(401).send({ message: 'Invalid username or password' });
    }

    return reply.send(await issueSession(credential.user));
  });

  app.post('/v1/auth/logout', async (request, reply) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return reply.code(401).send({ message: 'Authentication required' });

    await prisma.accessToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return reply.code(204).send();
  });

  app.get('/v1/users/:userId/state', async (request, reply) => {
    const params = request.params as { userId?: string };
    const userId = params.userId?.trim();

    if (!userId) {
      return reply.code(400).send({ message: 'userId is required' });
    }
    const authenticatedUserId = await requireUserId(request, reply);
    if (!authenticatedUserId) return;
    if (authenticatedUserId !== userId) return reply.code(403).send({ message: 'Forbidden' });

    const user = await prisma.remoteUser.findUnique({
      where: { id: userId },
      include: {
        habits: { orderBy: { clientId: 'asc' } },
        checkIns: { orderBy: [{ date: 'desc' }, { clientId: 'desc' }] },
      },
    });

    if (!user) {
      return reply.code(404).send({ message: 'User state not found' });
    }

    return {
      userId,
      state: {
        user: {
          name: user.name,
          email: user.email ?? undefined,
          picture: user.picture ?? undefined,
          provider: 'local',
          focusGoal: user.focusGoal ?? undefined,
          accentColor: user.accentColor ?? undefined,
          notificationsEnabled: user.notificationsOn,
          visualPreference: user.visualPreference === 'minimal' ? 'minimal' : 'glass',
        },
        habits: user.habits.map((habit) => ({
          id: habit.clientId,
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          category: habit.category,
          frequency: habit.frequency === 'specific_days' ? 'specific_days' : 'daily',
          daysOfWeek: JSON.parse(habit.daysOfWeek) as number[],
          goalValue: habit.goalValue,
          goalUnit: habit.goalUnit,
          color: habit.color,
          isActive: habit.isActive,
          createdAt: habit.createdAt.toISOString(),
        })),
        checkIns: user.checkIns.map((checkIn) => ({
          id: checkIn.clientId,
          habitId: checkIn.habitId,
          habitName: checkIn.habitName ?? undefined,
          habitColor: checkIn.habitColor ?? undefined,
          date: checkIn.date,
          value: checkIn.value,
          note: checkIn.note,
          createdAt: checkIn.createdAt.toISOString(),
        })),
      },
      lastSyncedAt: user.lastSyncedAt?.toISOString() ?? null,
    };
  });

  app.put('/v1/users/:userId/state', async (request, reply) => {
    const params = request.params as { userId?: string };
    const userId = params.userId?.trim();

    if (!userId) {
      return reply.code(400).send({ message: 'userId is required' });
    }
    const authenticatedUserId = await requireUserId(request, reply);
    if (!authenticatedUserId) return;
    if (authenticatedUserId !== userId) return reply.code(403).send({ message: 'Forbidden' });

    const expectedSyncAt = request.headers['if-unmodified-since'];
    if (typeof expectedSyncAt === 'string') {
      const existing = await prisma.remoteUser.findUnique({ where: { id: userId }, select: { lastSyncedAt: true } });
      const expectedDate = new Date(expectedSyncAt);
      if (existing?.lastSyncedAt && !Number.isNaN(expectedDate.getTime()) && existing.lastSyncedAt.getTime() > expectedDate.getTime()) {
        return reply.code(409).send({ message: 'Remote state changed on another device. Restore it before syncing again.' });
      }
    }

    const parsed = syncRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid sync payload', issues: parsed.error.flatten() });
    }

    const { state } = parsed.data;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.remoteUser.upsert({
        where: { id: userId },
        create: {
          id: userId,
          name: state.user.name,
          email: state.user.email,
          picture: state.user.picture,
          provider: state.user.provider ?? 'local',
          focusGoal: state.user.focusGoal,
          accentColor: state.user.accentColor,
          notificationsOn: state.user.notificationsEnabled ?? false,
          visualPreference: state.user.visualPreference ?? 'glass',
          lastSyncedAt: now,
        },
        update: {
          name: state.user.name,
          email: state.user.email,
          picture: state.user.picture,
          provider: state.user.provider ?? 'local',
          focusGoal: state.user.focusGoal,
          accentColor: state.user.accentColor,
          notificationsOn: state.user.notificationsEnabled ?? false,
          visualPreference: state.user.visualPreference ?? 'glass',
          lastSyncedAt: now,
        },
      });

      await tx.habit.deleteMany({ where: { userId } });
      await tx.checkIn.deleteMany({ where: { userId } });

      if (state.habits.length > 0) {
        await tx.habit.createMany({
          data: state.habits.map((habit) => ({
            userId,
            clientId: habit.id,
            name: habit.name,
            description: habit.description,
            icon: habit.icon,
            category: habit.category,
            frequency: habit.frequency,
            daysOfWeek: JSON.stringify(habit.daysOfWeek),
            goalValue: habit.goalValue,
            goalUnit: habit.goalUnit,
            color: habit.color,
            isActive: habit.isActive,
            createdAt: new Date(habit.createdAt),
          })),
        });
      }

      if (state.checkIns.length > 0) {
        await tx.checkIn.createMany({
          data: state.checkIns.map((checkIn) => ({
            userId,
            clientId: checkIn.id,
            habitId: checkIn.habitId,
            habitName: checkIn.habitName,
            habitColor: checkIn.habitColor,
            date: checkIn.date,
            value: checkIn.value,
            note: checkIn.note,
            createdAt: new Date(checkIn.createdAt),
          })),
        });
      }

      await tx.syncEvent.create({
        data: {
          userId,
          habitsCount: state.habits.length,
          checkInsCount: state.checkIns.length,
        },
      });
    });

    return reply.code(200).send({
      userId,
      habitsCount: state.habits.length,
      checkInsCount: state.checkIns.length,
      syncedAt: now.toISOString(),
    });
  });
}
