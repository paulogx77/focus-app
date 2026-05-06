import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';
import { formatWeekdayLabel } from '../utils/date';

export default function HabitCard({ habit, checked = false, onPress, onLongPress, dueToday = true }) {
  const weekdays = Array.isArray(habit.daysOfWeek)
    ? habit.daysOfWeek.map(formatWeekdayLabel).filter(Boolean).join(', ')
    : '';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: checked ? habit.color : colors.border },
        checked && styles.checked,
        pressed && styles.pressed,
        !dueToday && styles.disabled,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${habit.color}20` }]}>
        <MaterialCommunityIcons name={habit.icon} size={22} color={habit.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{habit.name}</Text>
          <View style={[styles.status, { backgroundColor: checked ? colors.success : colors.surfaceElevated }]} />
        </View>
        <Text style={styles.meta} numberOfLines={2}>
          {habit.category} {habit.goalValue ? `• Meta: ${habit.goalValue} ${habit.goalUnit}` : ''}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {habit.frequency === 'daily' ? 'Todos os dias' : `Dias: ${weekdays || 'não definido'}`}
        </Text>
        {habit.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {habit.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  checked: {
    backgroundColor: colors.surfaceElevated,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  description: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
});
