import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categories, colorOptions, frequencyOptions, goalUnits, iconOptions, weekdayOptions } from '../data/options';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';
import type { Habit, HabitDraft, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHabit'>;

type HabitForm = {
  name: string;
  description: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'specific_days';
  daysOfWeek: number[];
  goalValue: string;
  goalUnit: string;
  color: string;
};

const initialForm: HabitForm = {
  name: '',
  description: '',
  icon: 'check',
  category: categories[0],
  frequency: 'daily',
  daysOfWeek: [],
  goalValue: '',
  goalUnit: goalUnits[0],
  color: colorOptions[0],
};

export default function AddHabitScreen({ navigation, route }: Props) {
  const { addHabit, updateHabit, habits } = useAppState();
  const [form, setForm] = useState<HabitForm>(initialForm);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const habitId = route.params?.habitId;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!habitId) {
      setEditingHabit(null);
      setForm(initialForm);
      return;
    }

    const existing = habits.find((habit) => habit.id === habitId) ?? null;
    setEditingHabit(existing);

    if (existing) {
      setForm({
        name: existing.name ?? '',
        description: existing.description ?? '',
        icon: existing.icon ?? 'check',
        category: existing.category ?? categories[0],
        frequency: existing.frequency ?? 'daily',
        daysOfWeek: Array.isArray(existing.daysOfWeek) ? existing.daysOfWeek : [],
        goalValue: existing.goalValue === '' || existing.goalValue === null ? '' : String(existing.goalValue),
        goalUnit: existing.goalUnit ?? goalUnits[0],
        color: existing.color ?? colorOptions[0],
      });
    }
  }, [habitId, habits]);

  function setField<K extends keyof HabitForm>(key: K, value: HabitForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: number) {
    setForm((current) => {
      const exists = current.daysOfWeek.includes(day);

      return {
        ...current,
        daysOfWeek: exists ? current.daysOfWeek.filter((item) => item !== day) : [...current.daysOfWeek, day].sort((a, b) => a - b),
      };
    });
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      Alert.alert('Nome obrigatório', 'Informe o nome do hábito.');
      return;
    }

    if (form.frequency === 'specific_days' && form.daysOfWeek.length === 0) {
      Alert.alert('Escolha os dias', 'Selecione pelo menos um dia específico.');
      return;
    }

    const payload: HabitDraft = {
      name,
      description: form.description.trim(),
      icon: form.icon,
      category: form.category,
      frequency: form.frequency,
      daysOfWeek: form.frequency === 'specific_days' ? form.daysOfWeek : [],
      goalValue: form.goalValue ? Number(String(form.goalValue).replace(',', '.')) : '',
      goalUnit: form.goalUnit,
      color: form.color,
    };

    if (editingHabit) {
      await updateHabit(editingHabit.id, payload);
    } else {
      await addHabit(payload);
    }

    navigation.goBack();
  }

  const showSpecificDays = form.frequency === 'specific_days';

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(96, insets.bottom + 72) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>{editingHabit ? 'Editar hábito' : 'Novo hábito'}</Text>
          <Text style={styles.title}>Configuração detalhada</Text>
          <Text style={styles.subtitle}>Defina aparência, frequência, metas e dias de execução.</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.previewCard, { borderColor: `${form.color}66`, backgroundColor: `${form.color}14` }]}>
            <View style={styles.previewLeft}>
              <Text style={styles.previewKicker}>Preview</Text>
              <Text style={styles.previewTitle}>{form.name.trim() || 'Novo hábito'}</Text>
              <Text style={styles.previewMeta}>{form.category} • {form.frequency === 'daily' ? 'Diário' : 'Dias específicos'}</Text>
            </View>
            <View style={[styles.previewDot, { backgroundColor: form.color }]} />
          </View>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={form.name}
            onChangeText={(value) => setField('name', value)}
            style={styles.input}
            placeholder="Ex: Ler 20 minutos"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            value={form.description}
            onChangeText={(value) => setField('description', value)}
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Detalhe o contexto do hábito"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.wrapRow}>
            {categories.map((item) => (
              <Pressable key={item} onPress={() => setField('category', item)} style={[styles.chip, form.category === item && styles.chipSelected]}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Frequência</Text>
          <View style={styles.columnGap}>
            {frequencyOptions.map((option) => (
              <Pressable key={option.value} onPress={() => setField('frequency', option.value)} style={[styles.optionCard, form.frequency === option.value && styles.optionCardSelected]}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionSubtitle}>{option.description}</Text>
              </Pressable>
            ))}
          </View>

          {showSpecificDays ? (
            <View>
              <Text style={styles.label}>Dias específicos</Text>
              <View style={styles.weekRow}>
                {weekdayOptions.map((day) => (
                  <Pressable key={day.value} onPress={() => toggleDay(day.value)} style={[styles.weekChip, form.daysOfWeek.includes(day.value) && styles.weekChipSelected]}>
                    <Text style={styles.weekText}>{day.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>Meta diária</Text>
          <View style={styles.goalRow}>
            <TextInput
              value={String(form.goalValue)}
              onChangeText={(value) => setField('goalValue', value.replace(/[^0-9.,]/g, ''))}
              style={[styles.input, styles.goalInput]}
              placeholder="20"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <View style={styles.unitWrap}>
              {goalUnits.map((unit) => (
                <Pressable key={unit} onPress={() => setField('goalUnit', unit)} style={[styles.unitChip, form.goalUnit === unit && styles.unitChipSelected]}>
                  <Text style={styles.unitText}>{unit}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.label}>Ícone</Text>
          <View style={styles.iconGrid}>
            {iconOptions.map((icon) => (
              <Pressable key={icon.value} onPress={() => setField('icon', icon.value)} style={[styles.iconOption, form.icon === icon.value && styles.iconOptionSelected]}>
                <MaterialCommunityIcons name={icon.value as never} size={22} color={form.icon === icon.value ? colors.primaryLight : colors.textSecondary} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Cor do card</Text>
          <View style={styles.colorRow}>
            {colorOptions.map((color) => (
              <Pressable key={color} onPress={() => setField('color', color)} style={[styles.colorDot, { backgroundColor: color }, form.color === color && styles.colorDotSelected]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.button, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>Salvar hábito</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: 32,
    gap: spacing.lg,
  },
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
  card: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  previewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
  },
  previewLeft: {
    flex: 1,
    gap: 2,
  },
  previewKicker: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  previewMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  previewDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceGlassStrong,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chipSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}24`,
  },
  chipText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  columnGap: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
  },
  optionCardSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}22`,
  },
  optionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  weekChip: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  weekChipSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}22`,
  },
  weekText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  goalInput: {
    width: 84,
  },
  unitWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  unitChipSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}22`,
  },
  unitText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  iconOptionSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}22`,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: colors.textPrimary,
    transform: [{ scale: 1.1 }],
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: `${colors.primary}E6`,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
