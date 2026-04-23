import { getDatabase } from '../database';

export interface CheckIn {
  id: number;
  habit_id: number;
  date: string;
  value: number;
  note?: string;
  created_at: string;
}

export const checkInRepository = {

  // Busca todos os check-ins de um hábito
  getByHabit(habitId: number, limit = 90): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      `SELECT * FROM checkins
       WHERE habit_id = ?
       ORDER BY date DESC LIMIT ?`,
      [habitId, limit]
    );
  },

  // Busca check-ins de uma data específica (tela Hoje)
  getByDate(date: string): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      'SELECT * FROM checkins WHERE date = ?', [date]
    );
  },

  // Busca check-ins num intervalo de datas (Dashboard)
  getByDateRange(startDate: string, endDate: string): CheckIn[] {
    const db = getDatabase();
    return db.getAllSync<CheckIn>(
      `SELECT * FROM checkins
       WHERE date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [startDate, endDate]
    );
  },

  // Toggle: cria ou remove check-in do dia
  toggle(habitId: number, date: string): boolean {
    const db = getDatabase();
    const existing = db.getFirstSync<CheckIn>(
      'SELECT id FROM checkins WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );

    if (existing) {
      db.runSync('DELETE FROM checkins WHERE id = ?', [existing.id]);
      return false; // desmarcado
    } else {
      db.runSync(
        'INSERT INTO checkins (habit_id, date, value) VALUES (?, ?, 1)',
        [habitId, date]
      );
      return true; // marcado
    }
  },

  // Calcula sequência atual de um hábito
  getCurrentStreak(habitId: number): number {
    const db = getDatabase();
    const rows = db.getAllSync<{ date: string }>(
      `SELECT date FROM checkins
       WHERE habit_id = ?
       ORDER BY date DESC`,
      [habitId]
    );

    if (rows.length === 0) return 0;

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const row of rows) {
      const checkDate = new Date(row.date + 'T00:00:00');
      const diff = Math.round(
        (current.getTime() - checkDate.getTime()) / 86400000
      );

      if (diff === streak) {
        streak++;
        current = checkDate;
      } else {
        break;
      }
    }

    return streak;
  },
};