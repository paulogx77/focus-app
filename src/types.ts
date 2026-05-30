export type Frequency = 'daily' | 'specific_days';

export type UserProfile = {
  syncId?: string;
  name: string;
  email?: string;
  picture?: string;
  provider?: 'google' | 'local';
  focusGoal?: string;
  accentColor?: string;
  notificationsEnabled?: boolean;
  visualPreference?: 'glass' | 'minimal';
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
  habitName?: string;
  habitColor?: string;
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

export type SyncStatus = {
  isOnline: boolean;
  isSyncing: boolean;
  syncEnabled: boolean;
  hasPendingChanges: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
};

export type HistorySectionItem = CheckIn & {
  habit?: Habit;
};

export type HistorySection = {
  title: string;
  subtitle: string;
  data: HistorySectionItem[];
};

export type DashboardWeekItem = {
  key: string;
  label: string;
  value: number;
  completed: number;
  due: number;
};

export type DashboardMetrics = {
  activeHabits: number;
  dueToday: number;
  completedToday: number;
  successRate: number;
  bestStreak: number;
  weekSeries: DashboardWeekItem[];
};

export type TodayHabitItem = {
  habit: Habit;
  checkIn?: CheckIn;
  progressLabel: string;
  progressValue: number;
  isComplete: boolean;
};

export type TodaySummary = {
  totalHabits: number;
  dueHabits: TodayHabitItem[];
  completedCount: number;
  progress: number;
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
  Perfil: undefined;
};

export type AppStateContextValue = AppStateSnapshot & {
  isHydrated: boolean;
  syncStatus: SyncStatus;
  signIn: (user: UserProfile) => Promise<AppStateSnapshot>;
  syncNow: () => Promise<void>;
  updateProfile: (user: Partial<UserProfile>) => Promise<AppStateSnapshot>;
  signOut: () => Promise<AppStateSnapshot>;
  addHabit: (habit: HabitDraft) => Promise<AppStateSnapshot>;
  updateHabit: (habitId: number, payload: Partial<HabitDraft>) => Promise<AppStateSnapshot>;
  toggleHabitActive: (habitId: number) => Promise<AppStateSnapshot>;
  deleteHabit: (habitId: number) => Promise<AppStateSnapshot>;
  toggleCheckIn: (habitId: number, date?: string, value?: number, note?: string) => Promise<AppStateSnapshot>;
  resetCheckIns: () => Promise<AppStateSnapshot>;
  setState: (state: AppStateSnapshot) => Promise<AppStateSnapshot>;
  getHistorySections: () => Promise<HistorySection[]>;
  getDashboardMetrics: () => Promise<DashboardMetrics>;
  getTodaySummary: (date?: string) => Promise<TodaySummary>;
};
