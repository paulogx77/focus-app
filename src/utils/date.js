import { weekdayOptions } from '../data/options';

const pad = (value) => String(value).padStart(2, '0');

export function todayString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromString(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

export function isSameDay(a, b) {
  return todayString(a) === todayString(b);
}

export function formatLongDate(dateString) {
  const date = dateFromString(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

export function formatShortDate(dateString) {
  const date = dateFromString(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatWeekdayLabel(index) {
  return weekdayOptions.find((option) => option.value === index)?.label ?? '';
}

export function getRelativeLabel(dateString) {
  const target = dateFromString(dateString);
  const now = new Date();
  if (todayString(target) === todayString(now)) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (todayString(target) === todayString(yesterday)) return 'Ontem';
  return formatLongDate(dateString);
}

export function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}
