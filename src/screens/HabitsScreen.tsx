import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/habitStore';
import { Habit } from '../database/repositories/habitRepository';
import { habitRepository } from '../database/repositories/habitRepository';
import HabitForm from '../components/habits/HabitForm';
import HabitDetail from '../components/habits/HabitDetail';

const C = {
  bg: '#0F0F1A', surface: '#1A1A2E', surface2: '#252538',
  primary: '#7C3AED', text: '#FFFFFF', textSec: '#9CA3AF',
  border: '#2A2A3E', danger: '#EF4444',
};

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: 'water', fitness: 'barbell', book: 'book',
  meditation: 'leaf', code: 'code-slash', check: 'checkmark-circle',
  heart: 'heart', moon: 'moon', run: 'walk',
};

export default function HabitsScreen() {
  const { habits, loadHabits, deleteHabit } = useHabitStore();
  const [showForm, setShowForm]       = useState(false);
  const [selectedHabit, setSelected]  = useState<Habit | null>(null);
  const [showDetail, setShowDetail]   = useState(false);

  // Estado do modal de renomear
  const [editingHabit, setEditing]    = useState<Habit | null>(null);
  const [newName, setNewName]         = useState('');
  const [showRename, setShowRename]   = useState(false);

  useEffect(() => { loadHabits(); }, []);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remover hábito', `Deseja remover "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  };

  const handleOpenRename = (habit: Habit) => {
    setEditing(habit);
    setNewName(habit.name);
    setShowRename(true);
  };

  const handleRename = () => {
    if (!editingHabit || !newName.trim()) return;
    habitRepository.update(editingHabit.id, { name: newName.trim() });
    loadHabits();
    setShowRename(false);
    setEditing(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hábitos</Text>
          <Text style={styles.subtitle}>
            {habits.length} hábito{habits.length !== 1 ? 's' : ''} cadastrado{habits.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={56} color={C.primary} />
            <Text style={styles.emptyTitle}>Nenhum hábito ainda</Text>
            <Text style={styles.emptyText}>Toque no "+" para criar seu primeiro hábito!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
              <Text style={styles.emptyButtonText}>Criar primeiro hábito</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>SEUS HÁBITOS</Text>
            {habits.map(habit => {
              const iconName = ICON_MAP[habit.icon] ?? 'checkmark-circle';
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitCard}
                  onPress={() => { setSelected(habit); setShowDetail(true); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
                    <Ionicons name={iconName} size={22} color={habit.color} />
                  </View>

                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitMeta}>
                      {habit.category} • {habit.frequency === 'daily' ? 'Diário' : 'Dias específicos'}
                      {habit.goal_value ? ` • Meta: ${habit.goal_value}${habit.goal_unit ?? ''}` : ''}
                    </Text>
                  </View>

                  {/* Botão renomear */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenRename(habit)}
                  >
                    <Ionicons name="pencil-outline" size={17} color={C.textSec} />
                  </TouchableOpacity>

                  {/* Botão deletar */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(habit.id, habit.name)}
                  >
                    <Ionicons name="trash-outline" size={17} color={C.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Modal renomear */}
      <Modal visible={showRename} transparent animationType="fade" onRequestClose={() => setShowRename(false)}>
        <View style={styles.renameOverlay}>
          <View style={styles.renameBox}>
            <Text style={styles.renameTitle}>Renomear hábito</Text>
            <Text style={styles.renameHint}>Sua sequência não será afetada</Text>
            <TextInput
              style={styles.renameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nome do hábito"
              placeholderTextColor={C.textSec}
              autoFocus
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={styles.renameCancelBtn}
                onPress={() => setShowRename(false)}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renameSaveBtn,
                  !newName.trim() && { opacity: 0.4 },
                ]}
                onPress={handleRename}
                disabled={!newName.trim()}
              >
                <Text style={styles.renameSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <HabitForm visible={showForm} onClose={() => setShowForm(false)} />
      <HabitDetail
        habit={selectedHabit}
        visible={showDetail}
        onClose={() => { setShowDetail(false); setSelected(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 34, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 13, color: C.textSec, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 1.2, marginBottom: 12 },
  habitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '600', color: C.text },
  habitMeta: { fontSize: 12, color: C.textSec, marginTop: 3 },
  actionBtn: { padding: 8, marginLeft: 4 },

  // Rename modal
  renameOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  renameBox: { backgroundColor: C.surface, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: C.border },
  renameTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
  renameHint: { fontSize: 13, color: C.textSec, marginBottom: 20 },
  renameInput: { backgroundColor: C.surface2, borderRadius: 12, padding: 14, color: C.text, fontSize: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  renameActions: { flexDirection: 'row', gap: 12 },
  renameCancelBtn: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  renameCancelText: { color: C.textSec, fontSize: 15, fontWeight: '600' },
  renameSaveBtn: { flex: 2, paddingVertical: 13, backgroundColor: C.primary, borderRadius: 12, alignItems: 'center' },
  renameSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  emptyButton: { marginTop: 8, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});