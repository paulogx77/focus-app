export type Frequency = 'daily' | 'specific_days';

export type UserProfile = {
  name: string;
};

export type Habit = {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  frequency: Frequency;
  daysOfWeek: number[];
  goalValue: string;
  goalUnit: string;
  color: string;
  isActive: boolean;
  createdAt: string;
};

export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'isActive' | 'goalValue'> & {
  goalValue: string | number;
};

export type CheckIn = {
  id: number;
  habitId: number;
  date: string;
  value: number;
  note: string;
  createdAt: string;
};

export type AppStateSnapshot = {
  user: UserProfile | null;
  habits: Habit[];
  checkIns: CheckIn[];
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddHabit: { habitId?: number } | undefined;
};

export type BottomTabParamList = {
  Hoje: undefined;
  Hábitos: undefined;
  Dashboard: undefined;
  Histórico: undefined;
};

export type AppStateContextValue = AppStateSnapshot & {
  isHydrated: boolean;
  signIn: (name: string) => Promise<AppStateSnapshot>;
  signOut: () => Promise<AppStateSnapshot>;
  addHabit: (habit: HabitDraft) => Promise<AppStateSnapshot>;
  updateHabit: (habitId: number, payload: Partial<HabitDraft>) => Promise<AppStateSnapshot>;
  toggleHabitActive: (habitId: number) => Promise<AppStateSnapshot>;
  deleteHabit: (habitId: number) => Promise<AppStateSnapshot>;
  toggleCheckIn: (habitId: number, date?: string) => Promise<AppStateSnapshot>;
  resetCheckIns: () => Promise<AppStateSnapshot>;
  setState: (state: AppStateSnapshot) => Promise<AppStateSnapshot>;
};
