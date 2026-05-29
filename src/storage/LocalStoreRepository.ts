import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppStateSnapshot, CheckIn, DashboardMetrics, Habit, HistorySection, TodaySummary, UserProfile } from '../types';
import { AppStateRepository, initialState, normalizeCheckIn, normalizeHabit, normalizeState, normalizeUser } from './AppStateStorage';
import { addDays, formatShortDate, getRelativeLabel, startOfWeek, todayString } from '../utils/date';
import { getCheckInForHabitDate, getHabitProgress } from '../utils/habitProgress';

const STORAGE_KEY = 'focus.local.state.v2';
const LEGACY_STORAGE_KEY = 'focus.local.state.v1';

export class LocalStoreRepository implements AppStateRepository {
  private readonly storageKey = STORAGE_KEY;
  private readonly legacyStorageKey = LEGACY_STORAGE_KEY;

  public async loadState(): Promise<AppStateSnapshot> {
    const raw = await AsyncStorage.getItem(this.storageKey);

    if (raw) {
      try {
        return normalizeState(JSON.parse(raw) as Partial<AppStateSnapshot>);
      } catch {
        return initialState;
      }
    }

    const legacyRaw = await AsyncStorage.getItem(this.legacyStorageKey);
    if (!legacyRaw) {
      return initialState;
    }

    try {
      return normalizeState(JSON.parse(legacyRaw) as Partial<AppStateSnapshot>);
    } catch {
      return initialState;
    }
  }

  public async saveState(state: AppStateSnapshot): Promise<void> {
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(normalizeState(state)));
  }

  public async resetState(): Promise<void> {
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem(this.legacyStorageKey);
  }

  public async saveUser(user: UserProfile | null): Promise<void> {
    const state = await this.loadState();
    state.user = user ? normalizeUser(user) : null;
    await this.saveState(state);
  }

  public async upsertHabit(habit: Habit): Promise<void> {
    const state = await this.loadState();
    const nextHabit = normalizeHabit(habit);
    const index = state.habits.findIndex((item) => item.id === nextHabit.id);

    if (index >= 0) {
      state.habits[index] = nextHabit;
    } else {
      state.habits.push(nextHabit);
    }

    await this.saveState(state);
  }

  public async deleteHabit(habitId: number): Promise<void> {
    const state = await this.loadState();
    state.habits = state.habits.filter((habit) => habit.id !== habitId);
    await this.saveState(state);
  }

  public async replaceCheckIns(checkIns: CheckIn[]): Promise<void> {
    const state = await this.loadState();
    state.checkIns = checkIns.map((checkIn) => normalizeCheckIn(checkIn));
    await this.saveState(state);
  }

  public async upsertCheckIn(checkIn: CheckIn): Promise<void> {
    const state = await this.loadState();
    const nextCheckIn = normalizeCheckIn(checkIn);
    const index = state.checkIns.findIndex((item) => item.id === nextCheckIn.id);

    if (index >= 0) {
      state.checkIns[index] = nextCheckIn;
    } else {
      state.checkIns.push(nextCheckIn);
    }

    await this.saveState(state);
  }

  public async deleteCheckIn(habitId: number, date: string): Promise<void> {
    const state = await this.loadState();
    state.checkIns = state.checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date));
    await this.saveState(state);
  }

  public async getHistorySections(): Promise<HistorySection[]> {
    const state = await this.loadState();
    const habitMap = new Map(state.habits.map((habit) => [habit.id, habit]));
    const grouped = new Map<string, HistorySection['data']>();

    state.checkIns
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .forEach((checkIn) => {
        if (!grouped.has(checkIn.date)) {
          grouped.set(checkIn.date, []);
        }

        grouped.get(checkIn.date)?.push({
          ...checkIn,
          habit: habitMap.get(checkIn.habitId),
        });
      });

    return Array.from(grouped.entries()).map(([date, items]) => ({
      title: getRelativeLabel(date),
      subtitle: formatShortDate(date),
      data: items,
    }));
  }

  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const state = await this.loadState();
    const activeHabits = state.habits.filter((habit) => habit.isActive);
    const today = new Date();
    const todayKey = todayString(today);
    const dueToday = activeHabits.filter((habit) => this.isDueOnDate(habit, today));
    const completedToday = dueToday.filter((habit) => {
      const checkIn = state.checkIns.find((item) => item.habitId === habit.id && item.date === todayKey);
      return getHabitProgress(habit, checkIn).isComplete;
    });

    const weekStart = startOfWeek(today);
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekSeries = weekDays.map((date) => {
      const key = todayString(date);
      const due = activeHabits.filter((habit) => this.isDueOnDate(habit, date));
      const completed = due.filter((habit) => {
        const checkIn = state.checkIns.find((item) => item.habitId === habit.id && item.date === key);
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

    const bestStreak = activeHabits.reduce((best, habit) => {
      const completedDates = state.checkIns
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
      activeHabits: activeHabits.length,
      dueToday: dueToday.length,
      completedToday: completedToday.length,
      successRate: weekSeries.length ? weekSeries.reduce((sum, item) => sum + item.value, 0) / weekSeries.length : 0,
      bestStreak,
      weekSeries,
    };
  }

  public async getTodaySummary(date = todayString()): Promise<TodaySummary> {
    const state = await this.loadState();
    const targetDate = new Date(`${date}T00:00:00`);
    const dueHabits = state.habits
      .filter((habit) => this.isDueOnDate(habit, targetDate))
      .map((habit) => {
        const checkIn = getCheckInForHabitDate(state.checkIns, habit.id, date);
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
      totalHabits: state.habits.length,
      dueHabits,
      completedCount,
      progress: dueHabits.length ? completedCount / dueHabits.length : 0,
    };
  }

  private isDueOnDate(habit: Habit, date: Date): boolean {
    if (!habit.isActive) return false;
    if (habit.frequency === 'daily') return true;
    return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(date.getDay());
  }
}
