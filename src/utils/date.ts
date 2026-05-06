import { weekdayOptions } from '../data/options';

const pad = (value: number): string => String(value).padStart(2, '0');

export function todayString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromString(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

export function isSameDay(a: Date, b: Date): boolean {
  return todayString(a) === todayString(b);
}

export function formatLongDate(dateString: string): string {
  const date = dateFromString(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = dateFromString(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatWeekdayLabel(index: number): string {
  return weekdayOptions.find((option) => option.value === index)?.label ?? '';
}

export function getRelativeLabel(dateString: string): string {
  const target = dateFromString(dateString);
  const now = new Date();

  if (todayString(target) === todayString(now)) return 'Hoje';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (todayString(target) === todayString(yesterday)) return 'Ontem';

  return formatLongDate(dateString);
}

export function startOfWeek(date: Date = new Date()): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}
