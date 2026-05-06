import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import { categories, colorOptions, frequencyOptions, goalUnits, iconOptions, weekdayOptions } from '../data/options';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';

const initialForm = {
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

export default function AddHabitScreen({ navigation }) {
  const { addHabit, updateHabit, habits } = useAppState();
  const [form, setForm] = useState(initialForm);
  const [editingHabit, setEditingHabit] = useState(null);
  const route = useRoute();
  const habitId = route?.params?.habitId;

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

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day) {
    setForm((current) => {
      const exists = current.daysOfWeek.includes(day);
      return {
        ...current,
        daysOfWeek: exists
          ? current.daysOfWeek.filter((item) => item !== day)
          : [...current.daysOfWeek, day].sort((a, b) => a - b),
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

    const payload = {
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
    <ScrollView style={styles.safe} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{editingHabit ? 'Editar hábito' : 'Novo hábito'}</Text>
        <Text style={styles.title}>Configuração detalhada</Text>
        <Text style={styles.subtitle}>Defina aparência, frequência, metas e dias de execução.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <TextInput value={form.name} onChangeText={(value) => setField('name', value)} style={styles.input} placeholder="Ex: Ler 20 minutos" placeholderTextColor={colors.textSecondary} />

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
            <Pressable
              key={item}
              onPress={() => setField('category', item)}
              style={[styles.chip, form.category === item && styles.chipSelected]}
            >
              <Text style={styles.chipText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Frequência</Text>
        <View style={styles.columnGap}>
          {frequencyOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setField('frequency', option.value)}
              style={[styles.optionCard, form.frequency === option.value && styles.optionCardSelected]}
            >
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
                <Pressable
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  style={[styles.weekChip, form.daysOfWeek.includes(day.value) && styles.weekChipSelected]}
                >
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
              <Pressable
                key={unit}
                onPress={() => setField('goalUnit', unit)}
                style={[styles.unitChip, form.goalUnit === unit && styles.unitChipSelected]}
              >
                <Text style={styles.unitText}>{unit}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.label}>Ícone</Text>
        <View style={styles.iconGrid}>
          {iconOptions.map((icon) => (
            <Pressable
              key={icon.value}
              onPress={() => setField('icon', icon.value)}
              style={[styles.iconOption, form.icon === icon.value && styles.iconOptionSelected]}
            >
              <MaterialCommunityIcons
                name={icon.value}
                size={22}
                color={form.icon === icon.value ? colors.primaryLight : colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Cor do card</Text>
        <View style={styles.colorRow}>
          {colorOptions.map((color) => (
            <Pressable
              key={color}
              onPress={() => setField('color', color)}
              style={[styles.colorDot, { backgroundColor: color }, form.color === color && styles.colorDotSelected]}
            />
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}20`,
  },
  chipText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  columnGap: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
  },
  optionCardSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}18`,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weekChipSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}20`,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitChipSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}20`,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}20`,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
