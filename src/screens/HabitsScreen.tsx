import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import HabitCard from '../components/HabitCard';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../types';

export default function HabitsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { habits, toggleHabitActive, deleteHabit } = useAppState();

  const activeCount = useMemo(() => habits.filter((habit) => habit.isActive).length, [habits]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Hábitos</Text>
          <Text style={styles.title}>Biblioteca de hábitos</Text>
          <Text style={styles.subtitle}>Cadastre, revise e organize os hábitos do usuário.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('AddHabit', undefined)} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={habits.length} accent={colors.primaryLight} />
        <StatCard label="Ativos" value={activeCount} accent={colors.success} />
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum hábito criado</Text>
          <Text style={styles.emptyText}>Comece adicionando um hábito com ícone, cor, categoria e metas.</Text>
          <Pressable onPress={() => navigation.navigate('AddHabit', undefined)} style={styles.emptyAction}>
            <Text style={styles.emptyActionText}>Criar primeiro hábito</Text>
          </Pressable>
        </View>
      ) : (
        habits.map((habit) => (
          <View key={habit.id} style={styles.habitBlock}>
            <HabitCard habit={habit} checked={false} dueToday={habit.isActive} />
            <View style={styles.actionsRow}>
              <Pressable onPress={() => navigation.navigate('AddHabit', { habitId: habit.id })} style={[styles.actionChip, styles.editChip]}>
                <MaterialCommunityIcons name="pencil" size={16} color={colors.textPrimary} />
                <Text style={styles.actionText}>Editar</Text>
              </Pressable>
              <Pressable onPress={() => toggleHabitActive(habit.id)} style={[styles.actionChip, habit.isActive ? styles.activeChip : styles.inactiveChip]}>
                <Text style={styles.actionText}>{habit.isActive ? 'Ativo' : 'Inativo'}</Text>
              </Pressable>
              <Pressable onPress={() => deleteHabit(habit.id)} style={[styles.actionChip, styles.deleteChip]}>
                <Text style={styles.actionText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
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
    letterSpacing: 1.8,
    fontSize: 11,
    marginBottom: 6,
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
    marginTop: 4,
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 21,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  addButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
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
  emptyAction: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  emptyActionText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  habitBlock: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -2,
    marginBottom: spacing.md,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  editChip: {
    backgroundColor: `${colors.primaryLight}20`,
  },
  activeChip: {
    backgroundColor: `${colors.success}20`,
  },
  inactiveChip: {
    backgroundColor: `${colors.warning}20`,
  },
  deleteChip: {
    backgroundColor: `${colors.danger}20`,
  },
  actionText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
