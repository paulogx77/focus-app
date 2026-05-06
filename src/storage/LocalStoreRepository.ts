import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppStateSnapshot, CheckIn, Habit, UserProfile } from '../types';

const STORAGE_KEY = 'focus.local.state.v2';
const LEGACY_STORAGE_KEY = 'focus.local.state.v1';

export const initialState: AppStateSnapshot = {
  user: null,
  habits: [],
  checkIns: [],
};

export class LocalStoreRepository {
  private readonly storageKey = STORAGE_KEY;
  private readonly legacyStorageKey = LEGACY_STORAGE_KEY;

  public async loadState(): Promise<AppStateSnapshot> {
    const raw = await AsyncStorage.getItem(this.storageKey);

    if (raw) {
      try {
        return this.normalizeState(JSON.parse(raw) as Partial<AppStateSnapshot>);
      } catch {
        return initialState;
      }
    }

    const legacyRaw = await AsyncStorage.getItem(this.legacyStorageKey);
    if (!legacyRaw) {
      return initialState;
    }

    try {
      return this.normalizeState(JSON.parse(legacyRaw) as Partial<AppStateSnapshot>);
    } catch {
      return initialState;
    }
  }

  public async saveState(state: AppStateSnapshot): Promise<void> {
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.normalizeState(state)));
  }

  public async resetState(): Promise<void> {
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem(this.legacyStorageKey);
  }

  private normalizeState(state: Partial<AppStateSnapshot> = {}): AppStateSnapshot {
    const habits = Array.isArray(state.habits) ? state.habits.map((habit) => this.normalizeHabit(habit)) : [];
    const checkIns = Array.isArray(state.checkIns) ? state.checkIns.map((checkIn) => this.normalizeCheckIn(checkIn)) : [];

    return {
      user: this.normalizeUser(state.user ?? null),
      habits,
      checkIns,
    };
  }

  private normalizeHabit(habit: Partial<Habit>): Habit {
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

  private normalizeCheckIn(checkIn: Partial<CheckIn>): CheckIn {
    return {
      id: Number(checkIn.id ?? 0),
      habitId: Number(checkIn.habitId ?? 0),
      date: String(checkIn.date ?? ''),
      value: Number(checkIn.value ?? 1),
      note: String(checkIn.note ?? ''),
      createdAt: String(checkIn.createdAt ?? new Date().toISOString()),
    };
  }

  private normalizeUser(user: unknown): UserProfile | null {
    if (!user) {
      return null;
    }

    if (typeof user === 'string') {
      const name = user.trim();
      return name ? { name } : null;
    }

    if (typeof user === 'object' && 'name' in user) {
      const name = String((user as UserProfile).name ?? '').trim();
      return name ? { name } : null;
    }

    return null;
  }
}
