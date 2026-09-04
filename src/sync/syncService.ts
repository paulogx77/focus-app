import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import type { AppStateSnapshot, SyncStatus } from '../types';
import { normalizeState } from '../storage/AppStateStorage';

const SYNC_METADATA_KEY = 'focus.sync.metadata.v1';
const ACCESS_TOKEN_KEY = 'focus.sync.access-token.v1';

export type SyncMetadata = {
  userSyncId?: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
  lastSyncedSignature?: string;
};

type LocalSession = {
  token: string;
  user: AppStateSnapshot['user'];
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
  hasConflict: false,
};

export class SyncConflictError extends Error {}

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
    const parsed = JSON.parse(raw) as SyncMetadata & { accessToken?: string };

    // Move legacy token out of AsyncStorage on first launch after upgrade.
    if (parsed.accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, parsed.accessToken);
      delete parsed.accessToken;
      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return {};
  }
}

export async function loadAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
}

export async function clearSyncMetadata(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_METADATA_KEY);
}

export async function revokeSession(apiUrl: string, accessToken: string): Promise<void> {
  await fetch(`${apiUrl}/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function authenticateLocal(
  apiUrl: string,
  mode: 'login' | 'register',
  payload: { username: string; password: string; name?: string }
): Promise<LocalSession> {
  const response = await fetch(`${apiUrl}/v1/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => ({}))) as Partial<LocalSession & { message: string }>;

  if (!response.ok || !data.token || !data.user) {
    throw new Error(data.message || 'Falha ao entrar na conta.');
  }

  return { token: data.token, user: normalizeState({ user: data.user }).user };
}

export function computeSyncSignature(state: AppStateSnapshot): string {
  return JSON.stringify(state);
}

export async function syncSnapshot(apiUrl: string, state: AppStateSnapshot, accessToken: string, lastSyncedAt?: string): Promise<SyncResponse> {
  const syncId = state.user?.syncId?.trim();

  if (!state.user || !syncId) {
    throw new Error('Usuario sem identificador de sincronizacao.');
  }

  const response = await fetch(`${apiUrl}/v1/users/${encodeURIComponent(syncId)}/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(lastSyncedAt ? { 'If-Unmodified-Since': lastSyncedAt } : {}),
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
    if (response.status === 409) {
      throw new SyncConflictError('Dados remotos foram alterados em outro dispositivo. Restaure-os antes de sincronizar novamente.');
    }
    throw new Error(`Falha ao sincronizar (${response.status}).`);
  }

  const data = (await response.json()) as Partial<SyncResponse>;
  return {
    syncedAt: typeof data.syncedAt === 'string' ? data.syncedAt : new Date().toISOString(),
  };
}

export async function fetchRemoteSnapshot(apiUrl: string, syncId: string, accessToken: string): Promise<{ state: AppStateSnapshot; lastSyncedAt?: string } | null> {
  const response = await fetch(`${apiUrl}/v1/users/${encodeURIComponent(syncId)}/state`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

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
