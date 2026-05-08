import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HabitCard from '../components/HabitCard';
import ProgressBar from '../components/ProgressBar';
import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import { formatLongDate, todayString } from '../utils/date';
import type { Habit } from '../types';
import { getCheckInForHabitDate, getHabitProgress } from '../utils/habitProgress';

function isDueToday(habit: Habit, date = new Date()): boolean {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  return Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.includes(date.getDay());
}

export default function TodayScreen() {
  const { user, habits, checkIns, toggleCheckIn, signOut } = useAppState();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const today = new Date();
  const todayKey = todayString(today);

  const dueHabits = useMemo(() => habits.filter((habit) => isDueToday(habit, today)), [habits, todayKey]);

  const progressByHabitId = useMemo(() => {
    return new Map(
      dueHabits.map((habit) => {
        const checkIn = getCheckInForHabitDate(checkIns, habit.id, todayKey);
        return [habit.id, getHabitProgress(habit, checkIn)];
      })
    );
  }, [checkIns, dueHabits, todayKey]);

  const completedHabits = useMemo(
    () => dueHabits.filter((habit) => progressByHabitId.get(habit.id)?.isComplete),
    [dueHabits, progressByHabitId]
  );

  const progress = dueHabits.length ? completedHabits.length / dueHabits.length : 0;

  function openProgressEditor(habit: Habit) {
    const current = getCheckInForHabitDate(checkIns, habit.id, todayKey);
    setSelectedHabit(habit);
    setProgressInput(current ? String(current.value) : '');
  }

  async function saveProgress() {
    if (!selectedHabit) {
      return;
    }

    const parsed = Number(String(progressInput).replace(',', '.'));

    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Valor inválido', 'Informe uma quantidade válida para o progresso.');
      return;
    }

    await toggleCheckIn(selectedHabit.id, todayKey, parsed);
    setSelectedHabit(null);
    setProgressInput('');
  }

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
        <Text style={styles.sectionCount}>
          {completedHabits.length}/{dueHabits.length}
        </Text>
      </View>

      {dueHabits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sem hábitos para hoje</Text>
          <Text style={styles.emptyText}>Crie hábitos diários ou por dias específicos para vê-los aqui.</Text>
        </View>
      ) : (
        dueHabits.map((habit) => {
          const progressInfo = progressByHabitId.get(habit.id);

          return (
            <View key={habit.id}>
              <HabitCard
                habit={habit}
                checked={Boolean(progressInfo?.isComplete)}
                dueToday
                onPress={() => openProgressEditor(habit)}
                progressLabel={progressInfo?.label}
                progressValue={progressInfo?.percent}
              />
            </View>
          );
        })
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Foco do dia</Text>
        <Text style={styles.tipText}>Toque em um hábito para informar quanto você fez hoje.</Text>
      </View>

      <Modal visible={Boolean(selectedHabit)} transparent animationType="fade" onRequestClose={() => setSelectedHabit(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedHabit(null)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalKicker}>Progresso de hoje</Text>
            <Text style={styles.modalTitle}>{selectedHabit?.name}</Text>
            <Text style={styles.modalSubtitle}>Digite a quantidade feita agora. Ex: 30 páginas, 1 sessão.</Text>
            <TextInput
              value={progressInput}
              onChangeText={setProgressInput}
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSelectedHabit(null)} style={[styles.modalButton, styles.modalSecondaryButton]}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={saveProgress} style={[styles.modalButton, styles.modalPrimaryButton]}>
                <Text style={styles.modalPrimaryText}>Salvar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalKicker: {
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 12,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  modalSecondaryButton: {
    backgroundColor: colors.surfaceElevated,
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
  },
  modalSecondaryText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalPrimaryText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
