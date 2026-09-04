import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

import ProgressBar from '../components/ProgressBar';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import TestAdBanner from '../components/TestAdBanner';
import { useAppState } from '../context/AppStateContext';
import { useAppQuery } from '../context/useAppQuery';
import { colors, radius, spacing } from '../theme';
import type { DashboardMetrics } from '../types';

export default function DashboardScreen() {
  const { habits, checkIns, getDashboardMetrics } = useAppState();
  const metrics = useAppQuery<DashboardMetrics>(
    () => getDashboardMetrics(),
    [habits, checkIns, getDashboardMetrics],
    {
      initialData: {
        activeHabits: 0,
        dueToday: 0,
        completedToday: 0,
        successRate: 0,
        bestStreak: 0,
        weekSeries: [],
      },
    }
  );

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
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
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
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Resumo diário</Text>
          <Text style={styles.cardHelper}>Hoje</Text>
        </View>
        <ProgressBar value={metrics.dueToday ? metrics.completedToday / metrics.dueToday : 0} />
        <Text style={styles.summaryText}>
          {metrics.completedToday} hábitos concluídos de {metrics.dueToday} previstos hoje.
        </Text>
      </View>

      <TestAdBanner />
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
    letterSpacing: 1.8,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 21,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
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
    backgroundColor: colors.surfaceGlassStrong,
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
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
