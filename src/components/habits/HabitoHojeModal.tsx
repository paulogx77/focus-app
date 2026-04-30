import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../database/repositories/habitRepository';
import { checkInRepository } from '../../database/repositories/checkInRepository';
import { useHabitStore } from '../../store/habitStore';
import { getTodayString } from '../../utils/dateHelpers';

const C = {
  surface: '#1A1A2E',
  surface2:'#252538',
  bg:      '#0F0F1A',
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

export default function HabitoHojeModal({ habit, visible, onClose }: Props) {
  const { toggleCheckIn, isCheckedToday, loadTodayCheckIns } = useHabitStore();

  const [goalInput, setGoalInput] = useState('');
  const [note, setNote]           = useState('');
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    if (!habit || !visible) return;

    // Carrega dados do dia já salvos
    const today = getTodayString();
    const todayCheckins = checkInRepository.getByDate(today);
    const entry = todayCheckins.find(c => c.habit_id === habit.id);

    if (entry) {
      if (habit.goal_value) setGoalInput(String(entry.value));
      if (entry.note) setNote(entry.note);
    } else {
      setGoalInput('');
      setNote('');
    }
    setSaved(false);
  }, [habit, visible]);

  if (!habit) return null;

  const checkedToday  = isCheckedToday(habit.id);
  const iconName      = ICON_MAP[habit.icon] ?? 'checkmark-circle';
  const goalPct       = habit.goal_value && goalInput
    ? Math.min(100, Math.round((parseFloat(goalInput) / habit.goal_value) * 100))
    : 0;

  const handleSave = () => {
    const today = getTodayString();
    const db    = require('../../database/database').getDatabase();
    const existing = checkInRepository.getByDate(today).find(c => c.habit_id === habit.id);
    const value = habit.goal_value && goalInput ? parseFloat(goalInput) : 1;
    const noteVal = note.trim() || null;

    if (existing) {
      db.runSync(
        'UPDATE checkins SET value = ?, note = ? WHERE id = ?',
        [value, noteVal, existing.id]
      );
    } else {
      db.runSync(
        'INSERT INTO checkins (habit_id, date, value, note) VALUES (?, ?, ?, ?)',
        [habit.id, today, value, noteVal]
      );
    }

    loadTodayCheckIns();
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const handleToggle = () => {
    toggleCheckIn(habit.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
                <Ionicons name={iconName} size={24} color={habit.color} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitMeta}>{habit.category}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {/* Status de conclusão */}
            <TouchableOpacity
              style={[
                styles.statusRow,
                checkedToday
                  ? { backgroundColor: C.success + '22', borderColor: C.success + '55' }
                  : { backgroundColor: C.surface2, borderColor: C.border },
              ]}
              onPress={handleToggle}
            >
              <Ionicons
                name={checkedToday ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={checkedToday ? C.success : C.textSec}
              />
              <Text style={[styles.statusText, checkedToday && { color: C.success }]}>
                {checkedToday ? 'Concluído hoje ✓' : 'Marcar como concluído'}
              </Text>
            </TouchableOpacity>

            {/* Progresso da meta */}
            {habit.goal_value ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PROGRESSO DA META</Text>
                <View style={styles.goalCard}>
                  <View style={styles.goalRow}>
                    <TextInput
                      style={styles.goalInput}
                      value={goalInput}
                      onChangeText={setGoalInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.textSec}
                    />
                    <Text style={styles.goalDivider}>/</Text>
                    <Text style={styles.goalTarget}>
                      {habit.goal_value}{habit.goal_unit ?? ''}
                    </Text>
                  </View>

                  {/* Barra de progresso */}
                  <View style={styles.barBg}>
                    <View style={[
                      styles.barFill,
                      {
                        width: `${goalPct}%` as any,
                        backgroundColor: goalPct >= 100 ? C.success : habit.color,
                      },
                    ]} />
                  </View>

                  {/* Atalhos rápidos */}
                  <View style={styles.quickRow}>
                    {[25, 50, 75, 100].map(pct => (
                      <TouchableOpacity
                        key={pct}
                        style={[styles.quickBtn, { borderColor: habit.color + '66' }]}
                        onPress={() => setGoalInput(
                          String(((habit.goal_value! * pct) / 100).toFixed(1)
                            .replace(/\.0$/, ''))
                        )}
                      >
                        <Text style={[styles.quickBtnText, { color: habit.color }]}>
                          {pct}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.goalPctLabel}>
                    {goalPct}% da meta diária
                    {goalPct >= 100 ? ' 🎉' : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Anotação do dia */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ANOTAÇÃO DO DIA</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Como foi hoje? Algum destaque ou observação..."
                placeholderTextColor={C.textSec}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Botão salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: saved ? C.success : habit.color }]}
              onPress={handleSave}
            >
              <Ionicons
                name={saved ? 'checkmark' : 'save-outline'}
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveBtnText}>
                {saved ? 'Salvo!' : 'Salvar registro'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconBox: {
    width: 48, height: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  habitName: { fontSize: 18, fontWeight: '700', color: C.text },
  habitMeta: { fontSize: 12, color: C.textSec, marginTop: 2 },

  // Status toggle
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSec,
  },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSec,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Meta
  goalCard: {
    backgroundColor: C.surface2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInput: {
    fontSize: 30,
    fontWeight: '700',
    color: C.text,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    textAlign: 'center',
  },
  goalDivider: {
    fontSize: 24,
    color: C.textSec,
    marginHorizontal: 10,
  },
  goalTarget: {
    fontSize: 18,
    color: C.textSec,
    flex: 1,
  },
  barBg: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalPctLabel: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'right',
  },

  // Nota
  noteInput: {
    backgroundColor: C.surface2,
    borderRadius: 14,
    padding: 14,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 100,
  },

  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});