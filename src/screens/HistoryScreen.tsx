import { SectionList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import Screen from '../components/Screen';
import TestAdBanner from '../components/TestAdBanner';
import { useAppState } from '../context/AppStateContext';
import { useAppQuery } from '../context/useAppQuery';
import { colors, radius, spacing } from '../theme';
import { todayString } from '../utils/date';
import type { HistorySection } from '../types';

export default function HistoryScreen() {
  const { habits, checkIns, getHistorySections } = useAppState();
  const sections = useAppQuery<HistorySection[]>(() => getHistorySections(), [habits, checkIns, getHistorySections], { initialData: [] });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Histórico</Text>
        <Text style={styles.title}>Atividades registradas</Text>
        <Text style={styles.subtitle}>Consulte os check-ins feitos no aplicativo ao longo do tempo.</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="timeline-clock-outline" size={18} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Sem histórico ainda</Text>
          <Text style={styles.emptyText}>Os check-ins feitos na tela Hoje aparecerão aqui organizados por data.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.habit?.name ?? item.habitName ?? 'Hábito removido'}</Text>
                <Text style={styles.itemMeta}>
                  Valor: {item.value} • {item.date === todayString() ? 'Hoje' : item.date}
                </Text>
                {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
              </View>
              <View style={[styles.dot, { backgroundColor: item.habit?.color ?? item.habitColor ?? colors.success }]} />
            </View>
          )}
        />
      )}

      <TestAdBanner />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 4,
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
  emptyCard: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  emptyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  itemCard: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  itemLeft: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  itemNote: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.success,
  },
});
