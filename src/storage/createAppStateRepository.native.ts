import { SqliteStoreRepository } from './SqliteStoreRepository';

export function createAppStateRepository() {
  return new SqliteStoreRepository();
}
