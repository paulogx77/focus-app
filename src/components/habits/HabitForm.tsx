import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../store/habitStore';

const C = {
  bg:      '#0F0F1A',
  surface: '#1A1A2E',
  surface2:'#252538',
  primary: '#7C3AED',
  text:    '#FFFFFF',
  textSec: '#9CA3AF',
  border:  '#2A2A3E',
  input:   '#252538',
};

const ICONS: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'meditation', icon: 'leaf' },
  { key: 'water',      icon: 'water' },
  { key: 'run',        icon: 'walk' },
  { key: 'book',       icon: 'book' },
  { key: 'moon',       icon: 'moon' },
  { key: 'fitness',    icon: 'barbell' },
  { key: 'heart',      icon: 'heart' },
  { key: 'code',       icon: 'code-slash' },
];

const PRESET_CATEGORIES = [
  'Saúde', 'Mente', 'Corpo', 'Carreira', 'Finanças', 'Geral',
];

const COLORS = [
  '#7C3AED', '#2563EB', '#059669', '#DC2626',
  '#D97706', '#DB2777', '#0891B2', '#65A30D',
];

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface HabitFormProps {
  visible: boolean;
  onClose: () => void;
}

export default function HabitForm({ visible, onClose }: HabitFormProps) {
  const { addHabit } = useHabitStore();

  const [name, setName]               = useState('');
  const [selectedIcon, setIcon]       = useState('meditation');
  const [category, setCategory]       = useState('Saúde');
  const [customCategory, setCustom]   = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [frequency, setFrequency]     = useState<'daily' | 'specific_days'>('daily');
  const [selectedDays, setDays]       = useState<number[]>([1, 2, 3, 4, 5]);
  const [goalValue, setGoalValue]     = useState('');
  const [goalUnit, setGoalUnit]       = useState('');
  const [color, setColor]             = useState('#7C3AED');
  const [description, setDesc]        = useState('');

  const toggleDay = (index: number) => {
    setDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const getFinalCategory = () => {
    if (isCustomCat) return customCategory.trim() || 'Geral';
    return category;
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    if (isCustomCat && !customCategory.trim()) return;

    addHabit({
      name:         name.trim(),
      description:  description.trim() || undefined,
      icon:         selectedIcon,
      category:     getFinalCategory(),
      frequency,
      days_of_week: frequency === 'specific_days' ? selectedDays : undefined,
      goal_value:   goalValue ? parseFloat(goalValue) : undefined,
      goal_unit:    goalUnit.trim() || undefined,
      color,
    });

    resetAndClose();
  };

  const resetAndClose = () => {
    setName(''); setIcon('meditation'); setCategory('Saúde');
    setCustom(''); setIsCustomCat(false); setFrequency('daily');
    setDays([1, 2, 3, 4, 5]); setGoalValue(''); setGoalUnit('');
    setColor('#7C3AED'); setDesc('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Novo Hábito</Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {/* Nome */}
            <Text style={styles.label}>NOME DO HÁBITO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Meditação matinal"
              placeholderTextColor={C.textSec}
              value={name}
              onChangeText={setName}
            />

            {/* Ícone */}
            <Text style={styles.label}>ÍCONE</Text>
            <View style={styles.iconRow}>
              {ICONS.map(({ key, icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.iconOption,
                    selectedIcon === key && { borderColor: color, backgroundColor: color + '22' },
                  ]}
                  onPress={() => setIcon(key)}
                >
                  <Ionicons
                    name={icon} size={22}
                    color={selectedIcon === key ? color : C.textSec}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Cor */}
            <Text style={styles.label}>COR</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c },
                    color === c && styles.colorSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Categoria */}
            <Text style={styles.label}>CATEGORIA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {PRESET_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    !isCustomCat && category === cat && { backgroundColor: color, borderColor: color },
                  ]}
                  onPress={() => { setCategory(cat); setIsCustomCat(false); }}
                >
                  <Text style={[
                    styles.categoryText,
                    !isCustomCat && category === cat && { color: '#fff' },
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Chip "Personalizada" */}
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isCustomCat && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setIsCustomCat(true)}
              >
                <Ionicons
                  name="add" size={14}
                  color={isCustomCat ? '#fff' : C.textSec}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.categoryText, isCustomCat && { color: '#fff' }]}>
                  Personalizada
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Input categoria personalizada */}
            {isCustomCat && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Nome da sua categoria"
                placeholderTextColor={C.textSec}
                value={customCategory}
                onChangeText={setCustom}
                autoFocus
              />
            )}

            {/* Frequência */}
            <Text style={styles.label}>FREQUÊNCIA</Text>
            <View style={styles.freqRow}>
              <TouchableOpacity
                style={[styles.freqBtn,
                  frequency === 'daily' && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFrequency('daily')}
              >
                <Text style={[styles.freqText, frequency === 'daily' && { color: '#fff' }]}>
                  Todos os dias
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.freqBtn,
                  frequency === 'specific_days' && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFrequency('specific_days')}
              >
                <Text style={[styles.freqText, frequency === 'specific_days' && { color: '#fff' }]}>
                  Dias específicos
                </Text>
              </TouchableOpacity>
            </View>

            {frequency === 'specific_days' && (
              <View style={styles.daysRow}>
                {DAYS.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayBtn,
                      selectedDays.includes(index) && { backgroundColor: color, borderColor: color }]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[styles.dayText, selectedDays.includes(index) && { color: '#fff' }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Meta */}
            <Text style={styles.label}>META DIÁRIA (OPCIONAL)</Text>
            <View style={styles.goalRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="0"
                placeholderTextColor={C.textSec}
                keyboardType="numeric"
                value={goalValue}
                onChangeText={setGoalValue}
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Unidade (ex: min, ml, pág)"
                placeholderTextColor={C.textSec}
                value={goalUnit}
                onChangeText={setGoalUnit}
              />
            </View>

            {/* Descrição */}
            <Text style={styles.label}>DESCRIÇÃO (OPCIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Por que este hábito é importante?"
              placeholderTextColor={C.textSec}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDesc}
            />

            {/* Ações */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: color },
                  (!name.trim() || (isCustomCat && !customCategory.trim())) && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!name.trim() || (isCustomCat && !customCategory.trim())}
              >
                <Text style={styles.createText}>Criar hábito</Text>
              </TouchableOpacity>
            </View>

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
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  label: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  input: { backgroundColor: C.input, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border },
  textArea: { height: 88, textAlignVertical: 'top' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.surface2, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorOption: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#fff' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8, backgroundColor: C.surface2 },
  categoryText: { color: C.textSec, fontSize: 14, fontWeight: '500' },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface2 },
  freqText: { color: C.textSec, fontWeight: '600', fontSize: 14 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
  dayText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  goalRow: { flexDirection: 'row' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: C.textSec, fontSize: 16, fontWeight: '600' },
  createBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.4 },
  createText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});