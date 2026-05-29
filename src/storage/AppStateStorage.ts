import type { AppStateSnapshot, CheckIn, DashboardMetrics, Habit, HistorySection, TodaySummary, UserProfile } from '../types';

export type AppStateRepository = {
  loadState: () => Promise<AppStateSnapshot>;
  saveState: (state: AppStateSnapshot) => Promise<void>;
  resetState: () => Promise<void>;
  saveUser: (user: UserProfile | null) => Promise<void>;
  upsertHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (habitId: number) => Promise<void>;
  replaceCheckIns: (checkIns: CheckIn[]) => Promise<void>;
  upsertCheckIn: (checkIn: CheckIn) => Promise<void>;
  deleteCheckIn: (habitId: number, date: string) => Promise<void>;
  getHistorySections: () => Promise<HistorySection[]>;
  getDashboardMetrics: () => Promise<DashboardMetrics>;
  getTodaySummary: (date?: string) => Promise<TodaySummary>;
};

export const initialState: AppStateSnapshot = {
  user: null,
  habits: [],
  checkIns: [],
};

export function normalizeState(state: Partial<AppStateSnapshot> = {}): AppStateSnapshot {
  const habits = Array.isArray(state.habits) ? state.habits.map((habit) => normalizeHabit(habit)) : [];
  const checkIns = Array.isArray(state.checkIns) ? state.checkIns.map((checkIn) => normalizeCheckIn(checkIn)) : [];

  return {
    user: normalizeUser(state.user ?? null),
    habits,
    checkIns,
  };
}

export function normalizeHabit(habit: Partial<Habit>): Habit {
  return {
    id: Number(habit.id ?? 0),
    name: String(habit.name ?? '').trim(),
    description: String(habit.description ?? ''),
    icon: String(habit.icon ?? 'check'),
    category: String(habit.category ?? 'Geral'),
    frequency: habit.frequency === 'specific_days' ? 'specific_days' : 'daily',
    daysOfWeek: Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek.map(Number) : [],
    goalValue: habit.goalValue === null || habit.goalValue === undefined ? '' : String(habit.goalValue),
    goalUnit: String(habit.goalUnit ?? 'vez'),
    color: String(habit.color ?? '#7C3AED'),
    isActive: habit.isActive !== false,
    createdAt: String(habit.createdAt ?? new Date().toISOString()),
  };
}

export function normalizeCheckIn(checkIn: Partial<CheckIn>): CheckIn {
  return {
    id: Number(checkIn.id ?? 0),
    habitId: Number(checkIn.habitId ?? 0),
    habitName: String(checkIn.habitName ?? '').trim() || undefined,
    habitColor: String(checkIn.habitColor ?? '').trim() || undefined,
    date: String(checkIn.date ?? ''),
    value: Number(checkIn.value ?? 1),
    note: String(checkIn.note ?? ''),
    createdAt: String(checkIn.createdAt ?? new Date().toISOString()),
  };
}

export function normalizeUser(user: unknown): UserProfile | null {
  if (!user) {
    return null;
  }

  if (typeof user === 'string') {
    const name = user.trim();
    return name ? { name, provider: 'local' } : null;
  }

  if (typeof user === 'object' && 'name' in user) {
    const source = user as Partial<UserProfile>;
    const name = String(source.name ?? '').trim();

    if (!name) {
      return null;
    }

    return {
      name,
      email: String(source.email ?? '').trim() || undefined,
      picture: String(source.picture ?? '').trim() || undefined,
      provider: source.provider === 'google' ? 'google' : 'local',
      focusGoal: String(source.focusGoal ?? '').trim() || undefined,
      accentColor: String(source.accentColor ?? '').trim() || undefined,
      notificationsEnabled: false,
      visualPreference: source.visualPreference === 'minimal' ? 'minimal' : 'glass',
    };
  }

  return null;
}

export function hasMeaningfulState(state: AppStateSnapshot): boolean {
  return Boolean(state.user) || state.habits.length > 0 || state.checkIns.length > 0;
}
