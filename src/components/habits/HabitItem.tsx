import React, { useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../database/repositories/habitRepository';
import { colors } from '../../theme';

const ICON_MAP: Record<string, string> = {
  meditation: 'body',
  water:      'water',
  run:        'walk',
  book:       'book',
  moon:       'moon',
  code:       'code-slash',
  check:      'checkmark-circle',
  gym:        'barbell',
  heart:      'heart',
};

interface HabitItemProps {
  habit: Habit;
  isChecked: boolean;
  onToggle: (id: number) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, isChecked, onToggle }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    // Animação bounce no card
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Animação do check
    if (isChecked) {
      Animated.timing(checkScale, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.sequence([
        Animated.timing(checkScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }

    onToggle(habit.id);
  }, [isChecked, habit.id]);

  const iconName = ICON_MAP[habit.icon] ?? 'checkmark-circle';
  const frequencyLabel =
    habit.frequency === 'daily' ? 'Diário'
    : habit.frequency === 'weekly' ? 'Semanal'
    : 'Dias específicos';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, isChecked && styles.cardChecked]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrapper, { backgroundColor: habit.color + '22' }]}>
          <Ionicons
            name={iconName as any}
            size={22}
            color={isChecked ? habit.color : colors.textSecondary}
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, isChecked && styles.nameChecked]}>
            {habit.name}
          </Text>
          <Text style={styles.meta}>
            {habit.category} • {frequencyLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkButton, isChecked && { backgroundColor: habit.color }]}
          onPress={handlePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons
              name="checkmark"
              size={18}
              color={isChecked ? '#fff' : 'transparent'}
            />
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardChecked: { borderColor: '#7C3AED44' },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  nameChecked: { textDecorationLine: 'line-through', color: colors.textSecondary },
  meta: { color: colors.textSecondary, fontSize: 12 },
  checkButton: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
});