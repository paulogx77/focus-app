import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/habitStore';
import { formatDisplayDate, getTodayString } from '../utils/dateHelpers';
import { Habit } from '../database/repositories/habitRepository';
import HabitoHojeModal from '../components/habits/HabitoHojeModal';

const C = {
  bg:        '#0F0F1A',
  surface:   '#1A1A2E',
  surface2:  '#252538',
  primary:   '#7C3AED',
  primaryLt: '#A855F7',
  success:   '#10B981',
  text:      '#FFFFFF',
  textSec:   '#9CA3AF',
  border:    '#2A2A3E',
};

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: 'water', fitness: 'barbell', book: 'book',
  meditation: 'leaf', code: 'code-slash', check: 'checkmark-circle',
  heart: 'heart', moon: 'moon', run: 'walk',
};

interface HabitItemProps {
  habit: Habit;
  checked: boolean;
  onToggle: () => void;
  onPress: () => void;
}

function HabitItem({ habit, checked, onToggle, onPress }: HabitItemProps) {
  const iconName = ICON_MAP[habit.icon] ?? 'checkmark-circle';

  return (
    <TouchableOpacity
      style={[styles.habitCard, checked && styles.habitCardDone]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
        <Ionicons name={iconName} size={22} color={habit.color} />
      </View>

      <View style={styles.habitInfo}>
        <Text style={[styles.habitName, checked && styles.habitNameDone]}>
          {habit.name}
        </Text>
        <Text style={styles.habitMeta}>
          {habit.category} • {habit.frequency === 'daily' ? 'Diário' : 'Semanal'}
          {habit.goal_value ? ` • Meta: ${habit.goal_value}${habit.goal_unit ?? ''}` : ''}
        </Text>
      </View>

      {/* Checkbox — toque direto conclui sem abrir modal */}
      <TouchableOpacity
        style={[styles.checkbox, checked && styles.checkboxDone]}
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const {
    habits, loadHabits, loadTodayCheckIns,
    toggleCheckIn, isCheckedToday, getTodayProgress,
  } = useHabitStore();

  const [selectedHabit, setSelected] = useState<Habit | null>(null);
  const [showLog, setShowLog]        = useState(false);

  useEffect(() => {
    loadHabits();
    loadTodayCheckIns();
  }, []);

  const { completed, total, percentage } = getTodayProgress();
  const dateLabel = formatDisplayDate(getTodayString());

  const handlePress = (habit: Habit) => {
    setSelected(habit);
    setShowLog(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{dateLabel.toUpperCase()}</Text>
            <Text style={styles.title}>Hoje</Text>
          </View>
          <Ionicons name="settings-outline" size={24} color={C.textSec} />
        </View>

        {/* Card de progresso */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressPct}>{percentage}%</Text>
              <Text style={styles.progressSub}>
                {completed} de {total} hábito{total !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={22} color={C.primary} />
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` as any }]} />
          </View>
        </View>

        {/* Lista */}
        <Text style={styles.sectionTitle}>Seus Hábitos</Text>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={48} color={C.primary} />
            <Text style={styles.emptyTitle}>Nenhum hábito ainda</Text>
            <Text style={styles.emptyText}>
              Vá para a aba Hábitos e crie seu primeiro hábito!
            </Text>
          </View>
        ) : (
          habits.map(habit => (
            <HabitItem
              key={habit.id}
              habit={habit}
              checked={isCheckedToday(habit.id)}
              onToggle={() => toggleCheckIn(habit.id)}
              onPress={() => handlePress(habit)}
            />
          ))
        )}
      </ScrollView>

      <HabitoHojeModal
        habit={selectedHabit}
        visible={showLog}
        onClose={() => { setShowLog(false); setSelected(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
  dateLabel: { fontSize: 11, color: C.textSec, letterSpacing: 1.2, marginBottom: 2 },
  title: { fontSize: 34, fontWeight: '700', color: C.text },
  progressCard: { backgroundColor: C.primary + '22', borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: C.primary + '44' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressPct: { fontSize: 42, fontWeight: '700', color: C.primaryLt },
  progressSub: { fontSize: 14, color: C.textSec, marginTop: 2 },
  streakBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  progressBarBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 12 },
  habitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  habitCardDone: { opacity: 0.6 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '600', color: C.text },
  habitNameDone: { textDecorationLine: 'line-through', color: C.textSec },
  habitMeta: { fontSize: 12, color: C.textSec, marginTop: 3 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  emptyText: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 20 },
});