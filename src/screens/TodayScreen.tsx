import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/habitStore';
import { HabitItem } from '../components/habits/HabitItem';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatDisplayDate, getTodayString } from '../utils/dateHelpers';
import { colors } from '../theme';

const FadeInView: React.FC<{ delay?: number; children: React.ReactNode }> = ({
  delay = 0, children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export const TodayScreen: React.FC = () => {
  const {
    habits, loadHabits, loadTodayCheckIns,
    toggleCheckIn, isCheckedToday, getTodayProgress,
  } = useHabitStore();

  useEffect(() => {
    loadHabits();
    loadTodayCheckIns();
  }, []);

  const progress = getTodayProgress();
  const todayLabel = formatDisplayDate(getTodayString());
  const displayDate = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);
  const commaIndex = displayDate.indexOf(',');
  const weekday = commaIndex > -1 ? displayDate.slice(0, commaIndex) : displayDate;
  const rest = commaIndex > -1 ? displayDate.slice(commaIndex) : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text style={styles.dateSmall}>
              {weekday.toUpperCase()}{rest}
            </Text>
            <Text style={styles.title}>Hoje</Text>
          </View>
        </FadeInView>

        {/* Card de progresso */}
        <FadeInView delay={100}>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressPercent}>{progress.percentage}%</Text>
                <Text style={styles.progressSub}>
                  {progress.completed} de {progress.total} hábitos
                </Text>
              </View>
              <View style={styles.streakCircle}>
                <Ionicons name="flame" size={22} color={colors.primary} />
              </View>
            </View>
            <ProgressBar percentage={progress.percentage} height={8} />
          </View>
        </FadeInView>

        {/* Lista */}
        <Text style={styles.sectionTitle}>Seus Hábitos</Text>

        {habits.length === 0 ? (
          <FadeInView delay={200}>
            <View style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhum hábito cadastrado ainda.</Text>
              <Text style={styles.emptySubtext}>
                Vá até a aba "Hábitos" para criar o primeiro!
              </Text>
            </View>
          </FadeInView>
        ) : (
          habits.map((habit, index) => (
            <FadeInView key={habit.id} delay={150 + index * 60}>
              <HabitItem
                habit={habit}
                isChecked={isCheckedToday(habit.id)}
                onToggle={toggleCheckIn}
              />
            </FadeInView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header:  { marginBottom: 20, marginTop: 8 },
  dateSmall: {
    color: colors.textSecondary, fontSize: 13,
    fontWeight: '500', letterSpacing: 0.5, marginBottom: 4,
  },
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800' },
  progressCard: {
    backgroundColor: colors.primary + '22',
    borderRadius: 20, padding: 20, marginBottom: 28,
    borderWidth: 1, borderColor: colors.primary + '44',
  },
  progressTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  progressPercent: {
    color: colors.primary, fontSize: 42, fontWeight: '800', lineHeight: 48,
  },
  progressSub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  streakCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary, fontSize: 20,
    fontWeight: '700', marginBottom: 14,
  },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: {
    color: colors.textSecondary, fontSize: 16,
    fontWeight: '600', marginTop: 12,
  },
  emptySubtext: {
    color: colors.textSecondary, fontSize: 13,
    textAlign: 'center', opacity: 0.7, marginTop: 8,
  },
});