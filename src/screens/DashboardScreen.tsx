import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ProgressBar from '../components/ProgressBar';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import { addDays, startOfWeek, todayString } from '../utils/date';
import type { Habit } from '../types';
import { getCheckInForHabitDate, getHabitProgress } from '../utils/habitProgress';

function isDueToday(habit: Habit, date: Date): boolean {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(date.getDay());
}

export default function DashboardScreen() {
  const { habits, checkIns } = useAppState();

  const metrics = useMemo(() => {
    const activeHabits = habits.filter((habit) => habit.isActive);
    const today = new Date();
    const todayKey = todayString(today);
    const dueToday = activeHabits.filter((habit) => isDueToday(habit, today));
    const completedToday = dueToday.filter((habit) => getHabitProgress(habit, getCheckInForHabitDate(checkIns, habit.id, todayKey)).isComplete);

    const weekStart = startOfWeek(today);
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekSeries = weekDays.map((date) => {
      const key = todayString(date);
      const due = activeHabits.filter((habit) => isDueToday(habit, date));
      const completed = due.filter((habit) => getHabitProgress(habit, getCheckInForHabitDate(checkIns, habit.id, key)).isComplete);

      return {
        key,
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        value: due.length ? completed.length / due.length : 0,
        completed: completed.length,
        due: due.length,
      };
    });

    const bestStreak = activeHabits.reduce((best, habit) => {
      const completedDates = checkIns
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

    const successRate = weekSeries.length ? weekSeries.reduce((sum, item) => sum + item.value, 0) / weekSeries.length : 0;

    return {
      activeHabits: activeHabits.length,
      dueToday: dueToday.length,
      completedToday: completedToday.length,
      successRate,
      bestStreak,
      weekSeries,
    };
  }, [habits, checkIns]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Dashboard</Text>
          <Text style={styles.title}>Visão geral</Text>
          <Text style={styles.subtitle}>Acompanhe consistência, frequência e performance semanal.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Ativos" value={metrics.activeHabits} accent={colors.primaryLight} />
        <StatCard label="Hoje" value={metrics.completedToday} accent={colors.success} helper={`${metrics.dueToday} previstos`} />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Taxa semanal" value={`${Math.round(metrics.successRate * 100)}%`} accent={colors.warning} />
        <StatCard label="Maior streak" value={metrics.bestStreak} accent={colors.primary} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Últimos 7 dias</Text>
          <Text style={styles.cardHelper}>Concluídos sobre previstos</Text>
        </View>
        <View style={styles.chart}>
          {metrics.weekSeries.map((item) => (
            <View key={item.key} style={styles.barColumn}>
              <View style={styles.barWrap}>
                <View style={[styles.barFill, { height: `${Math.max(8, item.value * 100)}%` }]} />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValue}>{Math.round(item.value * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Resumo diário</Text>
          <Text style={styles.cardHelper}>Hoje</Text>
        </View>
        <ProgressBar value={metrics.dueToday ? metrics.completedToday / metrics.dueToday : 0} />
        <Text style={styles.summaryText}>
          {metrics.completedToday} hábitos concluídos de {metrics.dueToday} previstos hoje.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  kicker: {
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardHelper: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    height: 180,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barWrap: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  barValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
