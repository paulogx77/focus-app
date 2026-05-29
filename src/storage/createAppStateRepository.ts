import { LocalStoreRepository } from './LocalStoreRepository';

export function createAppStateRepository() {
  return new LocalStoreRepository();
}
