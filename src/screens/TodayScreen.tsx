import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HabitCard from '../components/HabitCard';
import ProgressBar from '../components/ProgressBar';
import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { useAppQuery } from '../context/useAppQuery';
import { colors, radius, spacing } from '../theme';
import { formatLongDate, todayString } from '../utils/date';
import type { Habit, TodaySummary } from '../types';

export default function TodayScreen() {
  const { user, habits, checkIns, toggleCheckIn, signOut, getTodaySummary } = useAppState();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const today = new Date();
  const todayKey = todayString(today);
  const accent = user?.accentColor ?? colors.primary;
  const summary = useAppQuery(
    () => getTodaySummary(todayKey),
    [habits, checkIns, getTodaySummary, todayKey],
    {
      initialData: {
        totalHabits: 0,
        dueHabits: [],
        completedCount: 0,
        progress: 0,
      },
    }
  );

  function openProgressEditor(habit: Habit) {
    const current = summary.dueHabits.find((item) => item.habit.id === habit.id)?.checkIn;
    setSelectedHabit(habit);
    setProgressInput(current ? String(current.value) : '');
    setNoteInput(current?.note ?? '');
  }

  function closeProgressEditor() {
    setSelectedHabit(null);
    setProgressInput('');
    setNoteInput('');
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

    await toggleCheckIn(selectedHabit.id, todayKey, parsed, noteInput);
    closeProgressEditor();
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
            <Text style={styles.dayBadgeText}>{summary.dueHabits.length} hábitos</Text>
          </View>
          <Pressable onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.quickPanel}>
        <View style={styles.quickPill}>
          <Text style={styles.quickPillValue}>{summary.totalHabits}</Text>
          <Text style={styles.quickPillLabel}>hábitos totais</Text>
        </View>
        <View style={styles.quickPill}>
          <Text style={styles.quickPillValue}>{summary.completedCount}</Text>
          <Text style={styles.quickPillLabel}>concluídos hoje</Text>
        </View>
        <View style={styles.quickPill}>
          <Text style={styles.quickPillValue}>{user?.provider === 'google' ? 'Google' : 'Local'}</Text>
          <Text style={styles.quickPillLabel}>sessão ativa</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View>
            <Text style={styles.progressTitle}>Progresso do dia</Text>
            <Text style={styles.progressSubtitle}>
              {summary.completedCount} de {summary.dueHabits.length} concluídos
            </Text>
          </View>
          <Text style={[styles.progressValue, { color: accent }]}>{Math.round(summary.progress * 100)}%</Text>
        </View>
        <ProgressBar value={summary.progress} fillColor={accent} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hábitos de hoje</Text>
        <Text style={styles.sectionCount}>
          {summary.completedCount}/{summary.dueHabits.length}
        </Text>
      </View>

      {summary.dueHabits.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="weather-night" size={18} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Sem hábitos para hoje</Text>
          <Text style={styles.emptyText}>Crie hábitos diários ou por dias específicos para vê-los aqui.</Text>
        </View>
      ) : (
        summary.dueHabits.map((item) => {
          return (
            <View key={item.habit.id}>
              <HabitCard
                habit={item.habit}
                checked={item.isComplete}
                dueToday
                onPress={() => openProgressEditor(item.habit)}
                progressLabel={item.progressLabel}
                progressValue={item.progressValue}
              />
            </View>
          );
        })
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Foco do dia</Text>
        <Text style={styles.tipText}>Toque em um hábito para informar quanto você fez hoje e adicionar uma nota opcional.</Text>
      </View>

      <Modal visible={Boolean(selectedHabit)} transparent animationType="fade" onRequestClose={closeProgressEditor}>
        <Pressable style={styles.modalBackdrop} onPress={closeProgressEditor}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <View style={styles.modalGlow} />
            <Text style={styles.modalKicker}>Progresso de hoje</Text>
            <Text style={styles.modalTitle}>{selectedHabit?.name}</Text>
            <Text style={styles.modalSubtitle}>Digite a quantidade feita agora e registre uma nota, se quiser.</Text>
            <Text style={styles.modalFieldLabel}>Quantidade</Text>
            <TextInput
              value={progressInput}
              onChangeText={setProgressInput}
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.modalFieldLabel}>Nota</Text>
            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              style={[styles.modalInput, styles.modalNoteInput]}
              placeholder="Nota opcional: como foi, contexto, dificuldade..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={closeProgressEditor} style={[styles.modalButton, styles.modalSecondaryButton]}>
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
    fontSize: 14,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceGlass,
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  progressCard: {
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
    fontSize: 28,
    fontWeight: '800',
  },
  quickPanel: {
    flexDirection: 'row',
    gap: 10,
  },
  quickPill: {
    flex: 1,
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 3,
  },
  quickPillValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  quickPillLabel: {
    color: colors.textSecondary,
    fontSize: 11,
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
  tipCard: {
    backgroundColor: colors.surfaceGlassStrong,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    backgroundColor: colors.surfaceGlassStrong,
    borderRadius: radius.xl,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 5,
  },
  modalGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.glow,
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
  modalFieldLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },
  modalNoteInput: {
    minHeight: 92,
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
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderGlass,
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
