export const categories = ['Saúde', 'Estudo', 'Trabalho', 'Bem-estar', 'Casa', 'Pessoal'] as const;

export const frequencyOptions = [
  { value: 'daily', label: 'Todos os dias', description: 'Fica ativo diariamente.' },
  { value: 'specific_days', label: 'Dias específicos', description: 'Escolha os dias da semana.' },
] as const;

export const goalUnits = ['min', 'vez', 'páginas', 'km', 'ml', 'sessão'] as const;

export const weekdayOptions = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
] as const;

export const iconOptions = [
  { value: 'check', label: 'Check' },
  { value: 'run', label: 'Run' },
  { value: 'dumbbell', label: 'Gym' },
  { value: 'book-open-variant', label: 'Book' },
  { value: 'brain', label: 'Mind' },
  { value: 'water', label: 'Water' },
  { value: 'heart-pulse', label: 'Heart' },
  { value: 'meditation', label: 'Calm' },
  { value: 'briefcase', label: 'Work' },
  { value: 'code-tags', label: 'Code' },
  { value: 'music', label: 'Music' },
  { value: 'weather-night', label: 'Sleep' },
  { value: 'food-apple', label: 'Food' },
  { value: 'alarm', label: 'Time' },
  { value: 'palette', label: 'Art' },
  { value: 'home-heart', label: 'Home' },
] as const;

export const colorOptions = [
  '#7C3AED',
  '#EC4899',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#14B8A6',
] as const;
