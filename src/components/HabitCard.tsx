import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ProgressBar from './ProgressBar';
import { colors, radius, spacing } from '../theme';
import { formatWeekdayLabel } from '../utils/date';
import type { Habit } from '../types';

type HabitCardProps = {
  habit: Habit;
  checked?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  dueToday?: boolean;
  progressLabel?: string;
  progressValue?: number;
};

export default function HabitCard({ habit, checked = false, onPress, onLongPress, dueToday = true, progressLabel, progressValue }: HabitCardProps) {
  const weekdays = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek.map(formatWeekdayLabel).filter(Boolean).join(', ') : '';
  const hasProgress = typeof progressValue === 'number' && typeof progressLabel === 'string';
  const statusColor = checked ? colors.success : hasProgress && progressValue > 0 ? colors.primaryLight : colors.surfaceElevated;

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
        <MaterialCommunityIcons name={habit.icon as never} size={22} color={habit.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{habit.name}</Text>
          <View style={[styles.status, { backgroundColor: statusColor }]} />
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
        {hasProgress ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>Progresso</Text>
              <Text style={styles.progressText}>{progressLabel}</Text>
            </View>
            <ProgressBar value={progressValue} fillColor={checked ? colors.success : colors.primaryLight} />
          </View>
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
  progressBlock: {
    gap: 8,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  status: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
});
