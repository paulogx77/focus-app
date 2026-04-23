import { getDatabase } from '../database';

export interface Habit {
  id: number;
  name: string;
  description?: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'specific_days';
  days_of_week?: number[];
  goal_value?: number;
  goal_unit?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateHabitDTO {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'specific_days';
  days_of_week?: number[];
  goal_value?: number;
  goal_unit?: string;
  color?: string;
}

export const habitRepository = {

  getAll(): Habit[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      'SELECT * FROM habits WHERE is_active = 1 ORDER BY created_at ASC'
    );
    return rows.map(parseHabit);
  },

  getById(id: number): Habit | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      'SELECT * FROM habits WHERE id = ?', [id]
    );
    return row ? parseHabit(row) : null;
  },

  create(data: CreateHabitDTO): number {
    const db = getDatabase();
    const result = db.runSync(
      `INSERT INTO habits
        (name, description, icon, category, frequency, days_of_week,
         goal_value, goal_unit, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description ?? null,
        data.icon ?? 'check',
        data.category ?? 'Geral',
        data.frequency ?? 'daily',
        data.days_of_week ? JSON.stringify(data.days_of_week) : null,
        data.goal_value ?? null,
        data.goal_unit ?? null,
        data.color ?? '#7C3AED',
      ]
    );
    return result.lastInsertRowId;
  },

  update(id: number, data: Partial<CreateHabitDTO>): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE habits SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        category = COALESCE(?, category),
        updated_at = datetime('now')
       WHERE id = ?`,
      [data.name ?? null, data.description ?? null,
       data.icon ?? null, data.category ?? null, id]
    );
  },

  softDelete(id: number): void {
    const db = getDatabase();
    db.runSync(
      'UPDATE habits SET is_active = 0 WHERE id = ?', [id]
    );
  },
};

// Helper interno para parsear o JSON de days_of_week
function parseHabit(row: any): Habit {
  return {
    ...row,
    is_active: row.is_active === 1,
    days_of_week: row.days_of_week
      ? JSON.parse(row.days_of_week)
      : undefined,
  };
}