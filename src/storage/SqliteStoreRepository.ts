import * as SQLite from 'expo-sqlite';

import type { AppStateSnapshot, CheckIn, DashboardMetrics, Habit, HistorySection, TodaySummary, UserProfile } from '../types';
import { AppStateRepository, hasMeaningfulState, normalizeCheckIn, normalizeHabit, normalizeState, normalizeUser } from './AppStateStorage';
import { LocalStoreRepository } from './LocalStoreRepository';
import { addDays, formatShortDate, getRelativeLabel, startOfWeek, todayString } from '../utils/date';
import { getCheckInForHabitDate, getHabitProgress } from '../utils/habitProgress';

type UserRow = {
  name: string;
  email: string | null;
  picture: string | null;
  provider: 'google' | 'local' | null;
  focus_goal: string | null;
  accent_color: string | null;
  notifications_enabled: number | null;
  visual_preference: 'glass' | 'minimal' | null;
  updated_at: string | null;
};

type HabitRow = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  frequency: 'daily' | 'specific_days' | null;
  days_of_week: string | null;
  goal_value: string | null;
  goal_unit: string | null;
  color: string | null;
  is_active: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type CheckInRow = {
  id: number;
  habit_id: number;
  habit_name: string | null;
  habit_color: string | null;
  date: string;
  value: number;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const DATABASE_NAME = 'focus.db';
const DATABASE_VERSION = 2;

export class SqliteStoreRepository implements AppStateRepository {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  public async loadState(): Promise<AppStateSnapshot> {
    const db = await this.getDatabase();
    await this.migrateLegacyStateIfNeeded(db);
    return this.loadStateFromDb(db);
  }

  public async saveState(state: AppStateSnapshot): Promise<void> {
    const db = await this.getDatabase();
    const normalized = normalizeState(state);

    await db.execAsync('BEGIN IMMEDIATE TRANSACTION');

    try {
      await db.execAsync('DELETE FROM user_profile; DELETE FROM habits; DELETE FROM check_ins;');

      if (normalized.user) {
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO user_profile (
            id, name, email, picture, provider, focus_goal, accent_color, notifications_enabled, visual_preference, updated_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          normalized.user.name,
          normalized.user.email ?? null,
          normalized.user.picture ?? null,
          normalized.user.provider ?? 'local',
          normalized.user.focusGoal ?? null,
          normalized.user.accentColor ?? null,
          normalized.user.notificationsEnabled === false ? 0 : 1,
          normalized.user.visualPreference ?? 'glass',
          now
        );
      }

      for (const habit of normalized.habits) {
        await db.runAsync(
          `INSERT INTO habits (
            id, name, description, icon, category, frequency, days_of_week, goal_value, goal_unit, color, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          habit.id,
          habit.name,
          habit.description,
          habit.icon,
          habit.category,
          habit.frequency,
          JSON.stringify(habit.daysOfWeek),
          habit.goalValue,
          habit.goalUnit,
          habit.color,
          habit.isActive ? 1 : 0,
          habit.createdAt,
          habit.createdAt
        );
      }

      for (const checkIn of normalized.checkIns) {
        await db.runAsync(
          `INSERT INTO check_ins (
            id, habit_id, habit_name, habit_color, date, value, note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          checkIn.id,
          checkIn.habitId,
          checkIn.habitName ?? null,
          checkIn.habitColor ?? null,
          checkIn.date,
          checkIn.value,
          checkIn.note,
          checkIn.createdAt,
          checkIn.createdAt
        );
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  public async resetState(): Promise<void> {
    const db = await this.getDatabase();
    await db.execAsync('DELETE FROM user_profile; DELETE FROM habits; DELETE FROM check_ins;');
  }

  public async saveUser(user: UserProfile | null): Promise<void> {
    const db = await this.getDatabase();
    await db.execAsync('DELETE FROM user_profile;');

    const normalizedUser = user ? normalizeUser(user) : null;
    if (!normalizedUser) {
      return;
    }

    await db.runAsync(
      `INSERT INTO user_profile (
        id, name, email, picture, provider, focus_goal, accent_color, notifications_enabled, visual_preference, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      normalizedUser.name,
      normalizedUser.email ?? null,
      normalizedUser.picture ?? null,
      normalizedUser.provider ?? 'local',
      normalizedUser.focusGoal ?? null,
      normalizedUser.accentColor ?? null,
      normalizedUser.notificationsEnabled === false ? 0 : 1,
      normalizedUser.visualPreference ?? 'glass',
      new Date().toISOString()
    );
  }

  public async upsertHabit(habit: Habit): Promise<void> {
    const db = await this.getDatabase();
    const normalizedHabit = normalizeHabit(habit);

    await db.runAsync(
      `INSERT OR REPLACE INTO habits (
        id, name, description, icon, category, frequency, days_of_week, goal_value, goal_unit, color, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      normalizedHabit.id,
      normalizedHabit.name,
      normalizedHabit.description,
      normalizedHabit.icon,
      normalizedHabit.category,
      normalizedHabit.frequency,
      JSON.stringify(normalizedHabit.daysOfWeek),
      normalizedHabit.goalValue,
      normalizedHabit.goalUnit,
      normalizedHabit.color,
      normalizedHabit.isActive ? 1 : 0,
      normalizedHabit.createdAt,
      new Date().toISOString()
    );
  }

  public async deleteHabit(habitId: number): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM habits WHERE id = ?', habitId);
  }

  public async replaceCheckIns(checkIns: CheckIn[]): Promise<void> {
    const db = await this.getDatabase();
    const normalizedCheckIns = checkIns.map((checkIn) => normalizeCheckIn(checkIn));

    await db.execAsync('BEGIN IMMEDIATE TRANSACTION');

    try {
      await db.execAsync('DELETE FROM check_ins;');

      for (const checkIn of normalizedCheckIns) {
        await db.runAsync(
          `INSERT INTO check_ins (
            id, habit_id, habit_name, habit_color, date, value, note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          checkIn.id,
          checkIn.habitId,
          checkIn.habitName ?? null,
          checkIn.habitColor ?? null,
          checkIn.date,
          checkIn.value,
          checkIn.note,
          checkIn.createdAt,
          checkIn.createdAt
        );
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  public async upsertCheckIn(checkIn: CheckIn): Promise<void> {
    const db = await this.getDatabase();
    const normalizedCheckIn = normalizeCheckIn(checkIn);

    await db.runAsync(
      `INSERT OR REPLACE INTO check_ins (
        id, habit_id, habit_name, habit_color, date, value, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      normalizedCheckIn.id,
      normalizedCheckIn.habitId,
      normalizedCheckIn.habitName ?? null,
      normalizedCheckIn.habitColor ?? null,
      normalizedCheckIn.date,
      normalizedCheckIn.value,
      normalizedCheckIn.note,
      normalizedCheckIn.createdAt,
      new Date().toISOString()
    );
  }

  public async deleteCheckIn(habitId: number, date: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM check_ins WHERE habit_id = ? AND date = ?', habitId, date);
  }

  public async getHistorySections(): Promise<HistorySection[]> {
    const db = await this.getDatabase();
    const habits = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id ASC');
    const checkIns = await db.getAllAsync<CheckInRow>('SELECT * FROM check_ins ORDER BY date DESC, id DESC');
    const habitMap = new Map(habits.map((habit) => [habit.id, this.mapHabitRow(habit)]));
    const grouped = new Map<string, HistorySection['data']>();

    for (const row of checkIns) {
      const item = this.mapCheckInRow(row);
      if (!grouped.has(item.date)) {
        grouped.set(item.date, []);
      }

      grouped.get(item.date)?.push({
        ...item,
        habit: habitMap.get(item.habitId),
      });
    }

    return Array.from(grouped.entries()).map(([date, items]) => ({
      title: getRelativeLabel(date),
      subtitle: formatShortDate(date),
      data: items,
    }));
  }

  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const db = await this.getDatabase();
    const habits = (await db.getAllAsync<HabitRow>('SELECT * FROM habits WHERE is_active = 1 ORDER BY id ASC')).map((habit) => this.mapHabitRow(habit));
    const weekStart = startOfWeek(new Date());
    const fromDate = todayString(weekStart);
    const checkIns = (await db.getAllAsync<CheckInRow>('SELECT * FROM check_ins WHERE date >= ? ORDER BY date DESC, id DESC', fromDate)).map((checkIn) => this.mapCheckInRow(checkIn));
    const today = new Date();
    const todayKey = todayString(today);
    const dueToday = habits.filter((habit) => this.isDueOnDate(habit, today));
    const completedToday = dueToday.filter((habit) => {
      const checkIn = checkIns.find((item) => item.habitId === habit.id && item.date === todayKey);
      return getHabitProgress(habit, checkIn).isComplete;
    });

    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekSeries = weekDays.map((date) => {
      const key = todayString(date);
      const due = habits.filter((habit) => this.isDueOnDate(habit, date));
      const completed = due.filter((habit) => {
        const checkIn = checkIns.find((item) => item.habitId === habit.id && item.date === key);
        return getHabitProgress(habit, checkIn).isComplete;
      });

      return {
        key,
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        value: due.length ? completed.length / due.length : 0,
        completed: completed.length,
        due: due.length,
      };
    });

    const bestStreak = habits.reduce((best, habit) => {
      const completedDates = checkIns
        .filter((checkIn) => checkIn.habitId === habit.id && getHabitProgress(habit, checkIn).isComplete)
        .map((checkIn) => checkIn.date)
        .sort((a, b) => b.localeCompare(a));

      let current = 0;
      let cursor = new Date();
      cursor.setHours(0, 0, 0, 0);

      while (completedDates.includes(todayString(cursor))) {
        current += 1;
        cursor = addDays(cursor, -1);
      }

      return Math.max(best, current);
    }, 0);

    return {
      activeHabits: habits.length,
      dueToday: dueToday.length,
      completedToday: completedToday.length,
      successRate: weekSeries.length ? weekSeries.reduce((sum, item) => sum + item.value, 0) / weekSeries.length : 0,
      bestStreak,
      weekSeries,
    };
  }

  public async getTodaySummary(date = todayString()): Promise<TodaySummary> {
    const db = await this.getDatabase();
    const habits = (await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id ASC')).map((habit) => this.mapHabitRow(habit));
    const checkIns = (await db.getAllAsync<CheckInRow>('SELECT * FROM check_ins WHERE date = ? ORDER BY id DESC', date)).map((checkIn) => this.mapCheckInRow(checkIn));
    const targetDate = new Date(`${date}T00:00:00`);
    const dueHabits = habits
      .filter((habit) => this.isDueOnDate(habit, targetDate))
      .map((habit) => {
        const checkIn = getCheckInForHabitDate(checkIns, habit.id, date);
        const progress = getHabitProgress(habit, checkIn);

        return {
          habit,
          checkIn,
          progressLabel: progress.label,
          progressValue: progress.percent,
          isComplete: progress.isComplete,
        };
      });

    const completedCount = dueHabits.filter((item) => item.isComplete).length;

    return {
      totalHabits: habits.length,
      dueHabits,
      completedCount,
      progress: dueHabits.length ? completedCount / dueHabits.length : 0,
    };
  }

  private async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = this.openAndPrepareDatabase();
    }

    return this.dbPromise;
  }

  private async openAndPrepareDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = Number(versionRow?.user_version ?? 0);

    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          picture TEXT,
          provider TEXT,
          focus_goal TEXT,
          accent_color TEXT,
          notifications_enabled INTEGER,
          visual_preference TEXT,
          updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS habits (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          category TEXT,
          frequency TEXT,
          days_of_week TEXT,
          goal_value TEXT,
          goal_unit TEXT,
          color TEXT,
          is_active INTEGER,
          created_at TEXT,
          updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS check_ins (
          id INTEGER PRIMARY KEY NOT NULL,
          habit_id INTEGER NOT NULL,
          habit_name TEXT,
          habit_color TEXT,
          date TEXT NOT NULL,
          value REAL NOT NULL,
          note TEXT,
          created_at TEXT,
          updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_check_ins_habit_date ON check_ins (habit_id, date);
      `);
    }

    if (currentVersion < 2) {
      await db.execAsync(`
        ALTER TABLE user_profile ADD COLUMN updated_at TEXT;
        ALTER TABLE habits ADD COLUMN updated_at TEXT;
        ALTER TABLE check_ins ADD COLUMN updated_at TEXT;
      `).catch(() => null);

      await db.execAsync(`
        UPDATE user_profile SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
        UPDATE habits SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);
        UPDATE check_ins SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_habit_date_unique ON check_ins (habit_id, date);
      `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);

    return db;
  }

  private async loadStateFromDb(db: SQLite.SQLiteDatabase): Promise<AppStateSnapshot> {
    const user = await db.getFirstAsync<UserRow>('SELECT * FROM user_profile WHERE id = 1 LIMIT 1');
    const habits = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id ASC');
    const checkIns = await db.getAllAsync<CheckInRow>('SELECT * FROM check_ins ORDER BY date DESC, id DESC');

    return normalizeState({
      user: user
        ? {
            name: user.name,
            email: user.email ?? undefined,
            picture: user.picture ?? undefined,
            provider: user.provider ?? 'local',
            focusGoal: user.focus_goal ?? undefined,
            accentColor: user.accent_color ?? undefined,
            notificationsEnabled: user.notifications_enabled !== 0,
            visualPreference: user.visual_preference ?? 'glass',
          }
        : null,
      habits: habits.map((habit) => this.mapHabitRow(habit)),
      checkIns: checkIns.map((checkIn) => this.mapCheckInRow(checkIn)),
    });
  }

  private async migrateLegacyStateIfNeeded(db: SQLite.SQLiteDatabase): Promise<boolean> {
    const counts = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_profile'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM check_ins'),
    ]);

    const hasPersistedRows = counts.some((row) => Number(row?.count ?? 0) > 0);
    if (hasPersistedRows) {
      return false;
    }

    const legacyRepository = new LocalStoreRepository();
    const legacyState = await legacyRepository.loadState();

    if (!hasMeaningfulState(legacyState)) {
      return false;
    }

    await this.saveState(legacyState);
    await legacyRepository.resetState();
    return true;
  }

  private parseDaysOfWeek(raw: string | null): number[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  private mapHabitRow(habit: HabitRow): Habit {
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description ?? '',
      icon: habit.icon ?? 'check',
      category: habit.category ?? 'Geral',
      frequency: habit.frequency === 'specific_days' ? 'specific_days' : 'daily',
      daysOfWeek: this.parseDaysOfWeek(habit.days_of_week),
      goalValue: habit.goal_value ?? '',
      goalUnit: habit.goal_unit ?? 'vez',
      color: habit.color ?? '#7C3AED',
      isActive: habit.is_active !== 0,
      createdAt: habit.created_at ?? new Date().toISOString(),
    };
  }

  private mapCheckInRow(checkIn: CheckInRow): CheckIn {
    return {
      id: checkIn.id,
      habitId: checkIn.habit_id,
      habitName: checkIn.habit_name ?? undefined,
      habitColor: checkIn.habit_color ?? undefined,
      date: checkIn.date,
      value: Number(checkIn.value ?? 1),
      note: checkIn.note ?? '',
      createdAt: checkIn.created_at ?? new Date().toISOString(),
    };
  }

  private isDueOnDate(habit: Habit, date: Date): boolean {
    if (!habit.isActive) return false;
    if (habit.frequency === 'daily') return true;
    return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(date.getDay());
  }
}
