import { create } from 'zustand';
import { Habit, habitRepository } from '../database/repositories/habitRepository';
import { CheckIn, checkInRepository } from '../database/repositories/checkInRepository';
import { getTodayString } from '../utils/dateHelpers';

interface HabitStore {
  habits: Habit[];
  todayCheckIns: CheckIn[];
  isLoading: boolean;

  // Actions
  loadHabits: () => void;
  loadTodayCheckIns: () => void;
  toggleCheckIn: (habitId: number) => void;
  addHabit: (data: any) => void;
  deleteHabit: (id: number) => void;

  // Computed helpers
  isCheckedToday: (habitId: number) => boolean;
  getTodayProgress: () => { completed: number; total: number; percentage: number };
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  todayCheckIns: [],
  isLoading: false,

  loadHabits: () => {
    const habits = habitRepository.getAll();
    set({ habits });
  },

  loadTodayCheckIns: () => {
    const today = getTodayString();
    const todayCheckIns = checkInRepository.getByDate(today);
    set({ todayCheckIns });
  },

  toggleCheckIn: (habitId: number) => {
    const today = getTodayString();
    checkInRepository.toggle(habitId, today);
    get().loadTodayCheckIns(); // re-sincroniza
  },

  addHabit: (data) => {
    habitRepository.create(data);
    get().loadHabits();
  },

  deleteHabit: (id: number) => {
    habitRepository.softDelete(id);
    get().loadHabits();
  },

  isCheckedToday: (habitId: number) => {
    return get().todayCheckIns.some(c => c.habit_id === habitId);
  },

  getTodayProgress: () => {
    const { habits, todayCheckIns } = get();
    const total = habits.length;
    const completed = todayCheckIns.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  },
}));