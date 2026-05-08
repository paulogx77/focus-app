

## 🎯 Contexto do Projeto

Estou desenvolvendo um app mobile chamado **Focus** em **React Native com Expo (TypeScript)**.
É um **gerenciador de hábitos com análise de dados e insights inteligentes** — projeto acadêmico com potencial de produto real.

O assistente deve atuar como **arquiteto de software e desenvolvedor sênior**, me ajudando a implementar funcionalidades, revisar código, sugerir melhorias e resolver problemas.

---

## 📱 Funcionalidades do App

- Cadastro de hábitos (frequência diária/semanal/dias específicos)
- Marcação de conclusão diária (check-in)
- Histórico de atividades
- Dashboard com gráficos (linha, barras, heatmap, taxa de sucesso, streak)
- Insights automáticos sobre desempenho
- Assistente de IA que responde perguntas sobre os dados do usuário
- Sugestão de rotina baseada em objetivos e tempo disponível

---

## ⚙️ Stack Técnica

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | React Native + Expo ~54.0.33        |
| Linguagem     | TypeScript ~5.9.2                   |
| Navegação     | React Navigation v7 (bottom tabs)   |
| Estado global | Zustand ^5.0.12                     |
| Banco local   | expo-sqlite ~16.0.10 (API síncrona) |
| Gráficos      | Victory Native ^41.20.2             |
| IA/Insights   | Claude API (Anthropic)              |
| Animações     | Animated API nativa do React Native |
| Ícones        | @expo/vector-icons ^15.0.3          |
| React         | 19.1.0                              |
| React Native  | 0.81.5                              |

> ⚠️ **NÃO usar react-native-reanimated** — incompatível com Expo Go nessa versão.
> Usar sempre o `Animated` nativo do React Native (`import { Animated } from 'react-native'`).

> ⚠️ **NÃO criar babel.config.js** — o Expo 54 já tem configuração Babel embutida.

> ✅ **Expo Go** no Android funciona normalmente com essa stack.

---

## 🗂️ Estrutura de Pastas

```
focus-app/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── src/
    ├── theme.ts
    ├── components/
    │   ├── ui/
    │   │   ├── Card.tsx
    │   │   └── ProgressBar.tsx       
    │   └── habits/
    │       ├── HabitItem.tsx         
    │       └── HabitForm.tsx
    ├── screens/
    │   ├── TodayScreen.tsx           
    │   ├── HabitsScreen.tsx
    │   ├── DashboardScreen.tsx
    │   └── HistoryScreen.tsx
    ├── database/
    │   ├── schema.ts                 
    │   ├── database.ts               
    │   └── repositories/
    │       ├── habitRepository.ts    
    │       └── checkInRepository.ts  
    ├── store/
    │   ├── habitStore.ts             
    │   └── dashboardStore.ts
    ├── services/
    │   └── analyticsService.ts
    ├── hooks/
    │   ├── useHabits.ts
    │   └── useAnalytics.ts
    └── utils/
        └── dateHelpers.ts            
```

---

## 🎨 Design System

```typescript
// src/theme.ts
export const colors = {
  background:    '#0F0F1A',
  surface:       '#1A1A2E',
  surfaceHover:  '#2A2A3E',
  primary:       '#7C3AED',
  primaryLight:  '#A855F7',
  success:       '#10B981',
  danger:        '#EF4444',
  textPrimary:   '#FFFFFF',
  textSecondary: '#9CA3AF',
  border:        '#2A2A3E',
} as const;
```

Sempre dark mode. Fundo `#0F0F1A`, destaque `#7C3AED` (roxo).

---

## 🗄️ Banco de Dados — Schema

### `src/database/schema.ts`
```typescript
export const CREATE_HABITS_TABLE = `
  CREATE TABLE IF NOT EXISTS habits (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    description  TEXT,
    icon         TEXT    NOT NULL DEFAULT 'check',
    category     TEXT    NOT NULL DEFAULT 'Geral',
    frequency    TEXT    NOT NULL DEFAULT 'daily',
    days_of_week TEXT,
    goal_value   REAL,
    goal_unit    TEXT,
    color        TEXT    NOT NULL DEFAULT '#7C3AED',
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_CHECKINS_TABLE = `
  CREATE TABLE IF NOT EXISTS checkins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL,
    date       TEXT    NOT NULL,
    value      REAL    NOT NULL DEFAULT 1,
    note       TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_checkins_habit_id ON checkins(habit_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(date);
`;
```

---

### `src/database/database.ts`
```typescript
import * as SQLite from 'expo-sqlite';
import { CREATE_HABITS_TABLE, CREATE_CHECKINS_TABLE, CREATE_INDEXES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('focus.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  try {
    const database = getDatabase();
    database.execSync('PRAGMA foreign_keys = ON;');
    database.execSync(CREATE_HABITS_TABLE);
    database.execSync(CREATE_CHECKINS_TABLE);
    database.execSync(CREATE_INDEXES);
    console.log('✅ Banco inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
};
```

---

### `src/database/repositories/habitRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface Habit {
  id: number;
  name: string;
  description?: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'specific_days';
  days_of_week?: number[];
  goal_value?: number;
  goal_unit?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateHabitDTO {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'specific_days';
  days_of_week?: number[];
  goal_value?: number;
  goal_unit?: string;
  color?: string;
}

export const habitRepository = {
  getAll(): Habit[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      'SELECT * FROM habits WHERE is_active = 1 ORDER BY created_at ASC'
    );
    return rows.map(parseHabit);
  },

  getById(id: number): Habit | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM habits WHERE id = ?', [id]);
    return row ? parseHabit(row) : null;
  },

  create(data: CreateHabitDTO): number {
    const db = getDatabase();
    const result = db.runSync(
      `INSERT INTO habits (name, description, icon, category, frequency,
       days_of_week, goal_value, goal_unit, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description ?? null,
        data.icon ?? 'check',
        data.category ?? 'Geral',
        data.frequency ?? 'daily',
        data.days_of_week ? JSON.stringify(data.days_of_week) : null,
        data.goal_value ?? null,
        data.goal_unit ?? null,
        data.color ?? '#7C3AED',
      ]
    );
    return result.lastInsertRowId;
  },

  update(id: number, data: Partial<CreateHabitDTO>): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE habits SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        category = COALESCE(?, category),
        updated_at = datetime('now')
       WHERE id = ?`,
      [data.name ?? null, data.description ?? null,
       data.icon ?? null, data.category ?? null, id]
    );
  },

  softDelete(id: number): void {
    const db = getDatabase();
    db.runSync('UPDATE habits SET is_active = 0 WHERE id = ?', [id]);
  },
};

function parseHabit(row: any): Habit {
  return {
    ...row,
    is_active: row.is_active === 1,
    days_of_week: row.days_of_week ? JSON.parse(row.days_of_week) : undefined,
  };
}
```

---

### `src/database/repositories/checkInRepository.ts`
```typescript
import { getDatabase } from '../database';

export interface CheckIn {
  id: number;
  habit_id: number;
  date: string;
  value: number;
  note?: string;
  created_at: string;
}

export const checkInRepository = {
  getByHabit(habitId: number): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      'SELECT * FROM checkins WHERE habit_id = ? ORDER BY date DESC', [habitId]
    );
  },

  getByDate(date: string): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      'SELECT * FROM checkins WHERE date = ?', [date]
    );
  },

  getByDateRange(startDate: string, endDate: string): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      `SELECT * FROM checkins WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
      [startDate, endDate]
    );
  },

  toggle(habitId: number, date: string): boolean {
    const db = getDatabase();
    const existing = db.getFirstSync<CheckIn>(
      'SELECT id FROM checkins WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );
    if (existing) {
      db.runSync('DELETE FROM checkins WHERE id = ?', [existing.id]);
      return false;
    } else {
      db.runSync(
        'INSERT INTO checkins (habit_id, date, value) VALUES (?, ?, 1)',
        [habitId, date]
      );
      return true;
    }
  },

  getCurrentStreak(habitId: number): number {
    const db = getDatabase();
    const rows = db.getAllSync<{ date: string }>(
      `SELECT date FROM checkins WHERE habit_id = ? ORDER BY date DESC`,
      [habitId]
    );
    if (rows.length === 0) return 0;
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    for (const row of rows) {
      const checkDate = new Date(row.date + 'T00:00:00');
      const diff = Math.round((current.getTime() - checkDate.getTime()) / 86400000);
      if (diff === streak) { streak++; current = checkDate; }
      else break;
    }
    return streak;
  },
};
```

---

### `src/store/habitStore.ts`
```typescript
import { create } from 'zustand';
import { Habit, habitRepository } from '../database/repositories/habitRepository';
import { CheckIn, checkInRepository } from '../database/repositories/checkInRepository';
import { getTodayString } from '../utils/dateHelpers';

interface HabitStore {
  habits: Habit[];
  todayCheckIns: CheckIn[];
  isLoading: boolean;
  loadHabits: () => void;
  loadTodayCheckIns: () => void;
  toggleCheckIn: (habitId: number) => void;
  addHabit: (data: any) => void;
  deleteHabit: (id: number) => void;
  isCheckedToday: (habitId: number) => boolean;
  getTodayProgress: () => { completed: number; total: number; percentage: number };
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  todayCheckIns: [],
  isLoading: false,

  loadHabits: () => { set({ habits: habitRepository.getAll() }); },

  loadTodayCheckIns: () => {
    set({ todayCheckIns: checkInRepository.getByDate(getTodayString()) });
  },

  toggleCheckIn: (habitId: number) => {
    checkInRepository.toggle(habitId, getTodayString());
    get().loadTodayCheckIns();
  },

  addHabit: (data) => { habitRepository.create(data); get().loadHabits(); },

  deleteHabit: (id: number) => { habitRepository.softDelete(id); get().loadHabits(); },

  isCheckedToday: (habitId: number) =>
    get().todayCheckIns.some(c => c.habit_id === habitId),

  getTodayProgress: () => {
    const { habits, todayCheckIns } = get();
    const total = habits.length;
    const completed = todayCheckIns.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  },
}));
```

---

### `src/utils/dateHelpers.ts`
```typescript
export const getTodayString = (): string =>
  new Date().toISOString().split('T')[0];

export const getDateRange = (days: number): string[] =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });

export const formatDisplayDate = (dateStr: string): string =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
```

---

### `src/components/ui/ProgressBar.tsx` ✅
```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 6,
  color = '#7C3AED',
  backgroundColor = '#2A2A3E',
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor }]}>
      <Animated.View
        style={[styles.fill, { width, height, backgroundColor: color }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { borderRadius: 100, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 100 },
});
```

---

### `src/components/habits/HabitItem.tsx` ✅
```typescript
import React, { useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../database/repositories/habitRepository';
import { colors } from '../../theme';

const ICON_MAP: Record<string, string> = {
  meditation: 'body',
  water:      'water',
  run:        'walk',
  book:       'book',
  moon:       'moon',
  code:       'code-slash',
  check:      'checkmark-circle',
  gym:        'barbell',
  heart:      'heart',
};

interface HabitItemProps {
  habit: Habit;
  isChecked: boolean;
  onToggle: (id: number) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, isChecked, onToggle }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    if (isChecked) {
      Animated.timing(checkScale, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.sequence([
        Animated.timing(checkScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }

    onToggle(habit.id);
  }, [isChecked, habit.id]);

  const iconName = ICON_MAP[habit.icon] ?? 'checkmark-circle';
  const frequencyLabel =
    habit.frequency === 'daily' ? 'Diário'
    : habit.frequency === 'weekly' ? 'Semanal'
    : 'Dias específicos';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, isChecked && styles.cardChecked]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrapper, { backgroundColor: habit.color + '22' }]}>
          <Ionicons
            name={iconName as any}
            size={22}
            color={isChecked ? habit.color : colors.textSecondary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isChecked && styles.nameChecked]}>
            {habit.name}
          </Text>
          <Text style={styles.meta}>
            {habit.category} • {frequencyLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkButton, isChecked && { backgroundColor: habit.color }]}
          onPress={handlePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons
              name="checkmark"
              size={18}
              color={isChecked ? '#fff' : 'transparent'}
            />
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  cardChecked: { borderColor: '#7C3AED44' },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  nameChecked: { textDecorationLine: 'line-through', color: colors.textSecondary },
  meta: { color: colors.textSecondary, fontSize: 12 },
  checkButton: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
});
```

---

### `src/screens/TodayScreen.tsx` ✅
```typescript
import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/habitStore';
import { HabitItem } from '../components/habits/HabitItem';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatDisplayDate, getTodayString } from '../utils/dateHelpers';
import { colors } from '../theme';

const FadeInView: React.FC<{ delay?: number; children: React.ReactNode }> = ({
  delay = 0, children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export const TodayScreen: React.FC = () => {
  const {
    habits, loadHabits, loadTodayCheckIns,
    toggleCheckIn, isCheckedToday, getTodayProgress,
  } = useHabitStore();

  useEffect(() => {
    loadHabits();
    loadTodayCheckIns();
  }, []);

  const progress = getTodayProgress();
  const todayLabel = formatDisplayDate(getTodayString());
  const displayDate = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);
  const commaIndex = displayDate.indexOf(',');
  const weekday = commaIndex > -1 ? displayDate.slice(0, commaIndex) : displayDate;
  const rest = commaIndex > -1 ? displayDate.slice(commaIndex) : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text style={styles.dateSmall}>{weekday.toUpperCase()}{rest}</Text>
            <Text style={styles.title}>Hoje</Text>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressPercent}>{progress.percentage}%</Text>
                <Text style={styles.progressSub}>{progress.completed} de {progress.total} hábitos</Text>
              </View>
              <View style={styles.streakCircle}>
                <Ionicons name="flame" size={22} color={colors.primary} />
              </View>
            </View>
            <ProgressBar percentage={progress.percentage} height={8} />
          </View>
        </FadeInView>

        <Text style={styles.sectionTitle}>Seus Hábitos</Text>

        {habits.length === 0 ? (
          <FadeInView delay={200}>
            <View style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhum hábito cadastrado ainda.</Text>
              <Text style={styles.emptySubtext}>Vá até a aba "Hábitos" para criar o primeiro!</Text>
            </View>
          </FadeInView>
        ) : (
          habits.map((habit, index) => (
            <FadeInView key={habit.id} delay={150 + index * 60}>
              <HabitItem
                habit={habit}
                isChecked={isCheckedToday(habit.id)}
                onToggle={toggleCheckIn}
              />
            </FadeInView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header:  { marginBottom: 20, marginTop: 8 },
  dateSmall: {
    color: colors.textSecondary, fontSize: 13,
    fontWeight: '500', letterSpacing: 0.5, marginBottom: 4,
  },
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800' },
  progressCard: {
    backgroundColor: colors.primary + '22', borderRadius: 20,
    padding: 20, marginBottom: 28,
    borderWidth: 1, borderColor: colors.primary + '44',
  },
  progressTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  progressPercent: { color: colors.primary, fontSize: 42, fontWeight: '800', lineHeight: 48 },
  progressSub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  streakCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', opacity: 0.7, marginTop: 8 },
});
```

---

### `App.tsx` ✅
```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './src/database/database';
import { TodayScreen } from './src/screens/TodayScreen';

const HabitsScreen = () => <View style={{flex:1,backgroundColor:'#0F0F1A'}}><Text style={{color:'#fff',marginTop:60,marginLeft:20}}>Hábitos</Text></View>;
const DashboardScreen = () => <View style={{flex:1,backgroundColor:'#0F0F1A'}}><Text style={{color:'#fff',marginTop:60,marginLeft:20}}>Dashboard</Text></View>;
const HistoryScreen = () => <View style={{flex:1,backgroundColor:'#0F0F1A'}}><Text style={{color:'#fff',marginTop:60,marginLeft:20}}>Histórico</Text></View>;

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      initDatabase()
        .then(() => setDbReady(true))
        .catch((err) => { console.error(err); setError(String(err)); });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (error) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0F0F1A'}}>
      <Text style={{color:'red',padding:20,textAlign:'center'}}>{error}</Text>
    </View>
  );

  if (!dbReady) return (
    <View style={{flex:1,justifyContent:'center',backgroundColor:'#0F0F1A'}}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: { backgroundColor: '#1A1A2E', borderTopColor: '#2A2A3E' },
            tabBarActiveTintColor: '#7C3AED',
            tabBarInactiveTintColor: '#555',
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              const icons: Record<string, string> = {
                Hoje: 'checkmark-circle', Hábitos: 'calendar',
                Dashboard: 'bar-chart', Histórico: 'time',
              };
              return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Hoje" component={TodayScreen} />
          <Tab.Screen name="Hábitos" component={HabitsScreen} />
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Histórico" component={HistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

---

## 🚀 Status das Sprints

### ✅ Sprint 1 — Infraestrutura (concluída)
- Banco de dados SQLite com schema, repositories e indexes
- Zustand store com habitStore
- Utilitários de data
- App.tsx com navegação por abas funcional
- Design system (theme.ts)

### ✅ Sprint 2 — Tela Hoje (concluída)
- `TodayScreen.tsx` com lista de hábitos do dia
- `HabitItem.tsx` com toggle de check-in e animações
- `ProgressBar.tsx` animada
- Integração real com `useHabitStore`
- Animações de entrada com `FadeInView` (Animated nativo)
- `SafeAreaView` do `react-native-safe-area-context`

### 🔜 Sprint 3 — Tela Hábitos (próxima)
- [ ] `HabitsScreen.tsx` — listagem de todos os hábitos cadastrados
- [ ] `HabitForm.tsx` — modal de criação (ícone, categoria, frequência, meta diária)
- [ ] Swipe para deletar hábito
- [ ] Integração completa com o store

### 🔜 Sprint 4 — Dashboard
- [ ] Cards de métricas (streak, taxa de sucesso, total check-ins)
- [ ] Gráfico de linha (consistência semanal) — Victory Native
- [ ] Gráfico de barras (concluídos por dia)
- [ ] Heatmap de atividade (últimos 6 meses)

### 🔜 Sprint 5 — Histórico
- [ ] Lista por hábito com taxa de sucesso e streak
- [ ] Atividade recente por data
- [ ] Calendário mensal por hábito

### 🔜 Sprint 6 — IA e Insights
- [ ] `analyticsService.ts`: algoritmos locais de detecção de padrões
- [ ] Integração com Claude API para insights narrativos
- [ ] Assistente conversacional sobre os dados do usuário
- [ ] Sugestão de rotina baseada em objetivos

---

## ⚠️ Observações Importantes

- O projeto é **acadêmico com prazo de ~1 mês** — pragmatismo é prioridade
- Usar sempre **expo-sqlite API síncrona** (`execSync`, `getAllSync`, `runSync`)
- **NÃO usar `gap` no StyleSheet** — não suportado nessa versão do RN. Usar `marginTop`/`marginBottom`
- **NÃO usar `react-native-reanimated`** — usar `Animated` nativo do React Native
- **NÃO criar `babel.config.js`** — Expo 54 já tem Babel embutido
- **SafeAreaView** deve ser importado de `react-native-safe-area-context`, não de `react-native`
- Design: fundo `#0F0F1A`, destaque `#7C3AED` (roxo), sempre dark mode
- TypeScript estrito em todos os arquivos
- Rodar com **Expo Go** no Android via `npx expo start`

---

*Prompt atualizado — Sprint 2 concluída. Próximo passo: Sprint 3 (HabitsScreen + HabitForm).*
