import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as Network from 'expo-network';

import { AppStateManager } from '../state/AppStateManager';
import { normalizeState } from '../storage/AppStateStorage';
import { createAppStateRepository } from '../storage/createAppStateRepository';
import { initialState } from '../storage/AppStateStorage';
import { clearSyncMetadata, computeSyncSignature, defaultSyncStatus, fetchRemoteSnapshot, getSyncApiUrl, loadSyncMetadata, saveSyncMetadata, syncSnapshot } from '../sync/syncService';
import type { AppStateContextValue, AppStateSnapshot, SyncStatus, UserProfile } from '../types';

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const repository = useMemo(() => createAppStateRepository(), []);
  const manager = useMemo(() => new AppStateManager(repository, setState), [repository]);
  const syncApiUrl = useMemo(() => getSyncApiUrl(), []);
  const syncMetadataRef = useRef<{ userSyncId?: string; lastSyncedAt?: string; lastSyncError?: string; lastSyncedSignature?: string }>({});
  const syncInFlightRef = useRef(false);
  const remoteRestoreAttemptedRef = useRef<string | null>(null);
  const syncSignature = useMemo(() => (state.user ? computeSyncSignature(state) : ''), [state]);

  async function restoreRemoteState(syncId: string): Promise<AppStateSnapshot | null> {
    if (syncInFlightRef.current || !syncApiUrl || !syncStatus.isOnline) {
      return null;
    }

    syncInFlightRef.current = true;
    setSyncStatus((current) => ({
      ...current,
      isSyncing: true,
      syncEnabled: true,
      lastSyncError: undefined,
    }));

    try {
      const remoteSnapshot = await fetchRemoteSnapshot(syncApiUrl, syncId);

      if (!remoteSnapshot) {
        setSyncStatus((current) => ({
          ...current,
          isSyncing: false,
          syncEnabled: true,
          lastSyncError: undefined,
        }));
        return null;
      }

      const nextState = normalizeState({
        ...remoteSnapshot.state,
        user: {
          ...remoteSnapshot.state.user,
          syncId,
        },
      });
      const metadata = {
        userSyncId: syncId,
        lastSyncedAt: remoteSnapshot.lastSyncedAt,
        lastSyncError: undefined,
        lastSyncedSignature: computeSyncSignature(nextState),
      };

      await manager.replaceState(nextState);
      syncMetadataRef.current = metadata;
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: false,
        lastSyncedAt: remoteSnapshot.lastSyncedAt,
        lastSyncError: undefined,
      }));

      return nextState;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao restaurar sincronizacao remota.';

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        lastSyncError: message,
      }));

      return null;
    } finally {
      syncInFlightRef.current = false;
    }
  }

  async function signIn(user: UserProfile): Promise<AppStateSnapshot> {
    const nextState = await manager.signIn(user);
    remoteRestoreAttemptedRef.current = null;

    if (!nextState.user?.syncId || !syncApiUrl || !syncStatus.isOnline) {
      return nextState;
    }

    const hasOnlyProfile = nextState.habits.length === 0 && nextState.checkIns.length === 0;

    if (!hasOnlyProfile) {
      return nextState;
    }

    remoteRestoreAttemptedRef.current = nextState.user.syncId;
    return (await restoreRemoteState(nextState.user.syncId)) ?? nextState;
  }

  async function syncNow(): Promise<void> {
    if (syncInFlightRef.current || !isHydrated || !state.user || !syncApiUrl || !syncStatus.isOnline) {
      return;
    }

    syncInFlightRef.current = true;
    setSyncStatus((current) => ({
      ...current,
      isSyncing: true,
      syncEnabled: true,
      lastSyncError: undefined,
    }));

    try {
      const result = await syncSnapshot(syncApiUrl, state);
      const metadata = {
        userSyncId: state.user.syncId,
        lastSyncedAt: result.syncedAt,
        lastSyncError: undefined,
        lastSyncedSignature: syncSignature,
      };

      syncMetadataRef.current = metadata;
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: false,
        lastSyncedAt: result.syncedAt,
        lastSyncError: undefined,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar.';
      const metadata = {
        ...syncMetadataRef.current,
        userSyncId: state.user.syncId,
        lastSyncError: message,
      };

      syncMetadataRef.current = metadata;
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: true,
        lastSyncError: message,
      }));
    } finally {
      syncInFlightRef.current = false;
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [networkState, metadata] = await Promise.all([manager.hydrate().then(() => Network.getNetworkStateAsync()), loadSyncMetadata()]);

        syncMetadataRef.current = metadata;

        if (mounted) {
          setSyncStatus((current) => ({
            ...current,
            isOnline: Boolean(networkState.isConnected && networkState.isInternetReachable !== false),
            syncEnabled: Boolean(syncApiUrl),
            lastSyncedAt: metadata.lastSyncedAt,
            lastSyncError: metadata.lastSyncError,
          }));
        }
      } catch (error) {
        console.error('Failed to hydrate app state', error);
      }

      if (mounted) {
        setIsHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [manager, syncApiUrl]);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((networkState) => {
      setSyncStatus((current) => ({
        ...current,
        isOnline: Boolean(networkState.isConnected && networkState.isInternetReachable !== false),
        syncEnabled: Boolean(syncApiUrl),
      }));
    });

    return () => {
      subscription.remove();
    };
  }, [syncApiUrl]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!state.user) {
      remoteRestoreAttemptedRef.current = null;
      syncMetadataRef.current = {};
      void clearSyncMetadata();
      setSyncStatus((current) => ({
        ...defaultSyncStatus,
        isOnline: current.isOnline,
        syncEnabled: Boolean(syncApiUrl),
      }));
      return;
    }

    const hasPendingChanges =
      syncMetadataRef.current.userSyncId !== state.user.syncId || syncMetadataRef.current.lastSyncedSignature !== syncSignature;
    const shouldRestoreRemoteState =
      Boolean(syncApiUrl) &&
      syncStatus.isOnline &&
      state.user.syncId !== remoteRestoreAttemptedRef.current &&
      state.habits.length === 0 &&
      state.checkIns.length === 0;

    setSyncStatus((current) => ({
      ...current,
      syncEnabled: Boolean(syncApiUrl),
      hasPendingChanges,
    }));

    if (shouldRestoreRemoteState && state.user.syncId) {
      remoteRestoreAttemptedRef.current = state.user.syncId;
      void restoreRemoteState(state.user.syncId);
      return;
    }

    if (hasPendingChanges && syncStatus.isOnline && syncApiUrl) {
      void syncNow();
    }
  }, [isHydrated, state.user, syncApiUrl, syncSignature, syncStatus.isOnline]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      isHydrated,
      syncStatus,
      signIn,
      syncNow,
      updateProfile: manager.updateProfile,
      signOut: manager.signOut,
      addHabit: manager.addHabit,
      updateHabit: manager.updateHabit,
      toggleHabitActive: manager.toggleHabitActive,
      deleteHabit: manager.deleteHabit,
      toggleCheckIn: manager.toggleCheckIn,
      resetCheckIns: manager.resetCheckIns,
      setState: manager.replaceState,
      getHistorySections: manager.getHistorySections,
      getDashboardMetrics: manager.getDashboardMetrics,
      getTodaySummary: manager.getTodaySummary,
    }),
    [state, isHydrated, manager, syncStatus]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}
