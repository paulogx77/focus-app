import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../database/repositories/habitRepository';
import { checkInRepository } from '../../database/repositories/checkInRepository';
import { useHabitStore } from '../../store/habitStore';
import { getTodayString, getDateRange } from '../../utils/dateHelpers';

const C = {
  bg:      '#0F0F1A',
  surface: '#1A1A2E',
  surface2:'#252538',
  primary: '#7C3AED',
  text:    '#FFFFFF',
  textSec: '#9CA3AF',
  border:  '#2A2A3E',
  success: '#10B981',
  danger:  '#EF4444',
};

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: 'water', fitness: 'barbell', book: 'book',
  meditation: 'leaf', code: 'code-slash', check: 'checkmark-circle',
  heart: 'heart', moon: 'moon', run: 'walk',
};

interface Props {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  completionRate: number;
  last30Days: { date: string; done: boolean }[];
}

export default function HabitDetail({ habit, visible, onClose }: Props) {
  const { loadTodayCheckIns, isCheckedToday } = useHabitStore();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [goalInput, setGoalInput]   = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (habit && visible) {
      loadStats();
      // Preenche valor atual da meta se já fez check-in hoje
      const todayCheckins = checkInRepository.getByDate(getTodayString());
      const todayEntry = todayCheckins.find(c => c.habit_id === habit.id);
      if (todayEntry && habit.goal_value) {
        setGoalInput(String(todayEntry.value));
      } else {
        setGoalInput('');
      }
    }
  }, [habit, visible]);

  const loadStats = () => {
    if (!habit) return;
    const allCheckIns = checkInRepository.getByHabit(habit.id, 365);
    const currentStreak = checkInRepository.getCurrentStreak(habit.id);

    // Longest streak
    let longest = 0, current = 0;
    const sorted = [...allCheckIns].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { current = 1; continue; }
      const prev = new Date(sorted[i - 1].date + 'T00:00:00');
      const curr = new Date(sorted[i].date + 'T00:00:00');
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      current = diff === 1 ? current + 1 : 1;
      if (current > longest) longest = current;
    }
    if (currentStreak > longest) longest = currentStreak;

    // Últimos 30 dias
    const range = getDateRange(30);
    const checkInDates = new Set(allCheckIns.map(c => c.date));
    const last30Days = range.map(date => ({ date, done: checkInDates.has(date) }));

    // Taxa de conclusão (últimos 30 dias)
    const done = last30Days.filter(d => d.done).length;
    const completionRate = Math.round((done / 30) * 100);

    setStats({ currentStreak, longestStreak: longest, totalCheckIns: allCheckIns.length, completionRate, last30Days });
  };

  const handleSaveGoal = () => {
    if (!habit || !goalInput) return;
    setSaving(true);
    const today = getTodayString();
    const value = parseFloat(goalInput);

    // Insere ou atualiza o check-in com o valor
    const existing = checkInRepository.getByDate(today).find(c => c.habit_id === habit.id);
    const db = require('../../database/database').getDatabase();

    if (existing) {
      db.runSync('UPDATE checkins SET value = ? WHERE id = ?', [value, existing.id]);
    } else {
      db.runSync(
        'INSERT INTO checkins (habit_id, date, value) VALUES (?, ?, ?)',
        [habit.id, today, value]
      );
    }

    loadTodayCheckIns();
    loadStats();
    setSaving(false);
  };

  if (!habit) return null;

  const iconName = ICON_MAP[habit.icon] ?? 'checkmark-circle';
  const checkedToday = isCheckedToday(habit.id);
  const goalPct = habit.goal_value && goalInput
    ? Math.min(100, Math.round((parseFloat(goalInput) / habit.goal_value) * 100))
    : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Header do hábito */}
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
                <Ionicons name={iconName} size={28} color={habit.color} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitMeta}>
                  {habit.category} • {habit.frequency === 'daily' ? 'Diário' : 'Dias específicos'}
                </Text>
                {habit.description ? (
                  <Text style={styles.habitDesc}>{habit.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {/* Registro de meta */}
            {habit.goal_value ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>META DE HOJE</Text>
                <View style={styles.goalCard}>
                  <View style={styles.goalInputRow}>
                    <TextInput
                      style={styles.goalInput}
                      value={goalInput}
                      onChangeText={setGoalInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.textSec}
                    />
                    <Text style={styles.goalSep}>/</Text>
                    <Text style={styles.goalTarget}>
                      {habit.goal_value}{habit.goal_unit ?? ''}
                    </Text>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: habit.color }]}
                      onPress={handleSaveGoal}
                    >
                      <Text style={styles.saveBtnText}>
                        {saving ? '...' : 'Salvar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Barra da meta */}
                  <View style={styles.goalBarBg}>
                    <View style={[styles.goalBarFill, {
                      width: `${goalPct}%`,
                      backgroundColor: goalPct >= 100 ? C.success : habit.color,
                    }]} />
                  </View>
                  <Text style={styles.goalPct}>{goalPct}% da meta diária</Text>
                </View>
              </View>
            ) : null}

            {/* Estatísticas */}
            {stats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ESTATÍSTICAS</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="flame" size={20} color="#F97316" />
                    <Text style={styles.statValue}>{stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Sequência atual</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="trophy" size={20} color="#EAB308" />
                    <Text style={styles.statValue}>{stats.longestStreak}</Text>
                    <Text style={styles.statLabel}>Maior sequência</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-done" size={20} color={C.success} />
                    <Text style={styles.statValue}>{stats.totalCheckIns}</Text>
                    <Text style={styles.statLabel}>Total concluídos</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name='percent' size={20} color={C.primary} />
                    <Text style={styles.statValue}>{stats.completionRate}%</Text>
                    <Text style={styles.statLabel}>Taxa 30 dias</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Histórico últimos 30 dias */}
            {stats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ÚLTIMOS 30 DIAS</Text>
                <View style={styles.calendarGrid}>
                  {stats.last30Days.map(({ date, done }) => (
                    <View
                      key={date}
                      style={[
                        styles.calendarDot,
                        done
                          ? { backgroundColor: habit.color }
                          : { backgroundColor: C.surface2 },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: C.surface2 }]} />
                  <Text style={styles.legendText}>Não concluído</Text>
                  <View style={[styles.legendDot, { backgroundColor: habit.color, marginLeft: 16 }]} />
                  <Text style={styles.legendText}>Concluído</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  habitName: { fontSize: 20, fontWeight: '700', color: C.text },
  habitMeta: { fontSize: 13, color: C.textSec, marginTop: 3 },
  habitDesc: { fontSize: 13, color: C.textSec, marginTop: 6, fontStyle: 'italic' },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 1.2, marginBottom: 12 },

  // Meta
  goalCard: { backgroundColor: C.surface2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalInput: { fontSize: 28, fontWeight: '700', color: C.text, minWidth: 60, textAlign: 'center', backgroundColor: C.bg, borderRadius: 10, padding: 8 },
  goalSep: { fontSize: 22, color: C.textSec, marginHorizontal: 8 },
  goalTarget: { fontSize: 18, color: C.textSec, flex: 1 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  goalBarBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  goalBarFill: { height: '100%', borderRadius: 3 },
  goalPct: { fontSize: 12, color: C.textSec },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: C.surface2, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border },
  statValue: { fontSize: 26, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.textSec, textAlign: 'center' },

  // Calendar
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calendarDot: { width: 28, height: 28, borderRadius: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 12, color: C.textSec },
});