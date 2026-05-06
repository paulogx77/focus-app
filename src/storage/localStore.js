import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'focus.local.state.v2';
const LEGACY_STORAGE_KEY = 'focus.local.state.v1';

const initialState = {
  user: null,
  habits: [],
  checkIns: [],
};

function normalizeHabit(habit) {
  return {
    id: Number(habit.id),
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

function normalizeCheckIn(checkIn) {
  return {
    id: Number(checkIn.id),
    habitId: Number(checkIn.habitId),
    date: String(checkIn.date),
    value: Number(checkIn.value ?? 1),
    note: String(checkIn.note ?? ''),
    createdAt: String(checkIn.createdAt ?? new Date().toISOString()),
  };
}

function normalizeUser(user) {
  if (!user) return null;
  if (typeof user === 'string') {
    return { name: user.trim() };
  }
  return user.name ? { name: String(user.name).trim() } : null;
}

function normalizeState(state) {
  const habits = Array.isArray(state.habits) ? state.habits.map(normalizeHabit) : [];
  const checkIns = Array.isArray(state.checkIns) ? state.checkIns.map(normalizeCheckIn) : [];
  return {
    user: normalizeUser(state.user),
    habits,
    checkIns,
  };
}

export async function loadState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return initialState;
    }
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) {
    return initialState;
  }

  try {
    return normalizeState(JSON.parse(legacyRaw));
  } catch {
    return initialState;
  }
}

export async function saveState(state) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export async function resetState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}
