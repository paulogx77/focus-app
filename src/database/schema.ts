export const CREATE_HABITS_TABLE = `
  CREATE TABLE IF NOT EXISTS habits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    icon        TEXT    NOT NULL DEFAULT 'check',
    category    TEXT    NOT NULL DEFAULT 'Geral',
    frequency   TEXT    NOT NULL DEFAULT 'daily',
    -- 'daily' | 'weekly' | 'specific_days'
    days_of_week TEXT,
    -- JSON array ex: '[1,2,3,4,5]' para Seg-Sex
    goal_value  REAL,
    goal_unit   TEXT,
    color       TEXT    NOT NULL DEFAULT '#7C3AED',
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_CHECKINS_TABLE = `
  CREATE TABLE IF NOT EXISTS checkins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL,
    date       TEXT    NOT NULL,
    -- formato: 'YYYY-MM-DD'
    value      REAL    NOT NULL DEFAULT 1,
    -- para hábitos com meta (ex: 1.5 litros)
    note       TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
    -- um check-in por hábito por dia
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_checkins_habit_id
    ON checkins(habit_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_date
    ON checkins(date);
`;