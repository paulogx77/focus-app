import type { CheckIn, Habit } from '../types';

export function parseGoalValue(value: string): number | null {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getCheckInForHabitDate(checkIns: CheckIn[], habitId: number, date: string): CheckIn | undefined {
  return checkIns.find((checkIn) => checkIn.habitId === habitId && checkIn.date === date);
}

export function getHabitProgress(habit: Habit, checkIn?: CheckIn) {
  const target = parseGoalValue(habit.goalValue);
  const current = Math.max(0, Number(checkIn?.value ?? 0));
  const isComplete = target ? current >= target : current > 0;
  const percent = target ? Math.min(1, current / target) : current > 0 ? 1 : 0;

  return {
    current,
    target,
    percent,
    isComplete,
    label: target ? `${current} de ${target} ${habit.goalUnit}` : `${current} ${habit.goalUnit}`,
  };
}
