import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import HabitCard from '../components/HabitCard';
import ProgressBar from '../components/ProgressBar';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import { formatLongDate, todayString } from '../utils/date';

function isDueToday(habit, date = new Date()) {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(date.getDay());
}

export default function TodayScreen() {
  const { user, habits, checkIns, toggleCheckIn, signOut } = useAppState();
  const today = new Date();
  const todayKey = todayString(today);

  const dueHabits = useMemo(
    () => habits.filter((habit) => isDueToday(habit, today)),
    [habits, todayKey]
  );

  const completedHabits = useMemo(
    () =>
      dueHabits.filter((habit) =>
        checkIns.some((checkIn) => checkIn.habitId === habit.id && checkIn.date === todayKey)
      ),
    [dueHabits, checkIns, todayKey]
  );

  const progress = dueHabits.length ? completedHabits.length / dueHabits.length : 0;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Hoje</Text>
          <Text style={styles.title}>Olá, {user?.name}</Text>
          <Text style={styles.subtitle}>{formatLongDate(todayKey)}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.dayBadge}>
            <MaterialCommunityIcons name="calendar-today" size={18} color={colors.primaryLight} />
            <Text style={styles.dayBadgeText}>{dueHabits.length} hábitos</Text>
          </View>
          <Pressable onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View>
            <Text style={styles.progressTitle}>Progresso do dia</Text>
            <Text style={styles.progressSubtitle}>
              {completedHabits.length} de {dueHabits.length} concluídos
            </Text>
          </View>
          <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar value={progress} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hábitos de hoje</Text>
        <Text style={styles.sectionCount}>{completedHabits.length}/{dueHabits.length}</Text>
      </View>

      {dueHabits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sem hábitos para hoje</Text>
          <Text style={styles.emptyText}>Crie hábitos diários ou por dias específicos para vê-los aqui.</Text>
        </View>
      ) : (
        dueHabits.map((habit) => {
          const checked = checkIns.some(
            (checkIn) => checkIn.habitId === habit.id && checkIn.date === todayKey
          );

          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              checked={checked}
              dueToday
              onPress={() => toggleCheckIn(habit.id, todayKey)}
            />
          );
        })
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Foco do dia</Text>
        <Text style={styles.tipText}>Toque em um hábito para marcar ou desmarcar sua execução de hoje.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  kicker: {
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  dayBadgeText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  progressSubtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressValue: {
    color: colors.primaryLight,
    fontSize: 28,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 6,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
    borderColor: colors.border,
    borderWidth: 1,
  },
  tipTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tipText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
