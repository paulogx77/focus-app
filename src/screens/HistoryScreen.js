import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import { formatShortDate, getRelativeLabel, todayString } from '../utils/date';

export default function HistoryScreen() {
  const { habits, checkIns } = useAppState();

  const sections = useMemo(() => {
    const habitMap = new Map(habits.map((habit) => [habit.id, habit]));
    const grouped = new Map();

    checkIns
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((checkIn) => {
        if (!grouped.has(checkIn.date)) grouped.set(checkIn.date, []);
        grouped.get(checkIn.date).push({ ...checkIn, habit: habitMap.get(checkIn.habitId) });
      });

    return Array.from(grouped.entries()).map(([date, items]) => ({
      title: getRelativeLabel(date),
      subtitle: formatShortDate(date),
      data: items,
    }));
  }, [habits, checkIns]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Histórico</Text>
        <Text style={styles.title}>Atividades registradas</Text>
        <Text style={styles.subtitle}>Consulte os check-ins feitos no aplicativo ao longo do tempo.</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyCard}>
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
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.habit?.name ?? 'Hábito removido'}</Text>
                <Text style={styles.itemMeta}>Valor: {item.value} • {item.date === todayString() ? 'Hoje' : item.date}</Text>
              </View>
              <View style={styles.dot} />
            </View>
          )}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: 10,
    gap: 12,
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
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.success,
  },
});
