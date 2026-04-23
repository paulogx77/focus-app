import * as SQLite from 'expo-sqlite';
import {
  CREATE_HABITS_TABLE,
  CREATE_CHECKINS_TABLE,
  CREATE_INDEXES,
} from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    // Troca openDatabaseSync pelo openDatabase correto
    db = SQLite.openDatabaseSync('focus.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  try {
    const database = getDatabase();

    // execSync não retorna Promise — não use await nele
    database.execSync('PRAGMA foreign_keys = ON;');
    database.execSync(CREATE_HABITS_TABLE);
    database.execSync(CREATE_CHECKINS_TABLE);
    database.execSync(CREATE_INDEXES);

    console.log('✅ Banco inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
};