import type { FastifyInstance } from 'fastify';

import { prisma } from './db.js';
import { syncRequestSchema } from './schemas.js';

export function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/v1/users/:userId/state', async (request, reply) => {
    const params = request.params as { userId?: string };
    const userId = params.userId?.trim();

    if (!userId) {
      return reply.code(400).send({ message: 'userId is required' });
    }

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
          provider: user.provider === 'google' ? 'google' : 'local',
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
