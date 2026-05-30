import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import type { AppStateSnapshot, SyncStatus } from '../types';
import { normalizeState } from '../storage/AppStateStorage';

const SYNC_METADATA_KEY = 'focus.sync.metadata.v1';

export type SyncMetadata = {
  userSyncId?: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
  lastSyncedSignature?: string;
};

type SyncResponse = {
  syncedAt: string;
};

type RemoteStateResponse = {
  userId: string;
  state: AppStateSnapshot;
  lastSyncedAt: string | null;
};

export const defaultSyncStatus: SyncStatus = {
  isOnline: false,
  isSyncing: false,
  syncEnabled: false,
  hasPendingChanges: false,
};

export function getSyncApiUrl(): string {
  const raw = Constants.expoConfig?.extra?.syncApiUrl;
  return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
}

export async function loadSyncMetadata(): Promise<SyncMetadata> {
  const raw = await AsyncStorage.getItem(SYNC_METADATA_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as SyncMetadata;
  } catch {
    return {};
  }
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
}

export async function clearSyncMetadata(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_METADATA_KEY);
}

export function computeSyncSignature(state: AppStateSnapshot): string {
  return JSON.stringify(state);
}

export async function syncSnapshot(apiUrl: string, state: AppStateSnapshot): Promise<SyncResponse> {
  const syncId = state.user?.syncId?.trim();

  if (!state.user || !syncId) {
    throw new Error('Usuario sem identificador de sincronizacao.');
  }

  const response = await fetch(`${apiUrl}/v1/users/${encodeURIComponent(syncId)}/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state: {
        user: state.user,
        habits: state.habits,
        checkIns: state.checkIns,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao sincronizar (${response.status}).`);
  }

  const data = (await response.json()) as Partial<SyncResponse>;
  return {
    syncedAt: typeof data.syncedAt === 'string' ? data.syncedAt : new Date().toISOString(),
  };
}

export async function fetchRemoteSnapshot(apiUrl: string, syncId: string): Promise<{ state: AppStateSnapshot; lastSyncedAt?: string } | null> {
  const response = await fetch(`${apiUrl}/v1/users/${encodeURIComponent(syncId)}/state`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao carregar sincronizacao remota (${response.status}).`);
  }

  const data = (await response.json()) as Partial<RemoteStateResponse>;
  const normalizedState = normalizeState(data.state ?? {});

  return {
    state: normalizedState,
    lastSyncedAt: typeof data.lastSyncedAt === 'string' ? data.lastSyncedAt : undefined,
  };
}
