import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as Network from 'expo-network';

import { AppStateManager } from '../state/AppStateManager';
import { normalizeState } from '../storage/AppStateStorage';
import { createAppStateRepository } from '../storage/createAppStateRepository';
import { initialState } from '../storage/AppStateStorage';
import { authenticateLocal as authenticateLocalAccount, clearAccessToken, clearSyncMetadata, computeSyncSignature, defaultSyncStatus, fetchRemoteSnapshot, getSyncApiUrl, loadAccessToken, loadSyncMetadata, revokeSession, saveAccessToken, saveSyncMetadata, SyncConflictError, syncSnapshot } from '../sync/syncService';
import type { AppStateContextValue, AppStateSnapshot, SyncStatus, UserProfile } from '../types';
import { addDays, todayString } from '../utils/date';
import type { CheckIn, Habit } from '../types';

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const repository = useMemo(() => createAppStateRepository(), []);
  const manager = useMemo(() => new AppStateManager(repository, setState), [repository]);
  const syncApiUrl = useMemo(() => getSyncApiUrl(), []);
  const syncMetadataRef = useRef<{ userSyncId?: string; lastSyncedAt?: string; lastSyncError?: string; lastSyncedSignature?: string; accessToken?: string }>({});
  const syncInFlightRef = useRef(false);
  const remoteRestoreAttemptedRef = useRef<string | null>(null);
  const syncSignature = useMemo(() => (state.user ? computeSyncSignature(state) : ''), [state]);

  async function restoreRemoteState(syncId: string): Promise<AppStateSnapshot | null> {
    const accessToken = syncMetadataRef.current.accessToken;
    if (syncInFlightRef.current || !syncApiUrl || !syncStatus.isOnline || !accessToken) {
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
      const remoteSnapshot = await fetchRemoteSnapshot(syncApiUrl, syncId, accessToken);

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
      syncMetadataRef.current = { ...metadata, accessToken };
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: false,
        hasConflict: false,
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

  async function authenticateLocal(mode: 'login' | 'register', credentials: { username: string; password: string; name?: string }): Promise<AppStateSnapshot> {
    if (!syncApiUrl) {
      throw new Error('Sincronizacao remota indisponivel. Configure a URL da API.');
    }

    const session = await authenticateLocalAccount(syncApiUrl, mode, credentials);
    if (!session.user) {
      throw new Error('Conta retornou dados invalidos.');
    }

    const metadata = { userSyncId: session.user.syncId };
    syncMetadataRef.current = { ...metadata, accessToken: session.token };
    await saveAccessToken(session.token);
    await saveSyncMetadata(metadata);
    return signIn(session.user);
  }

  async function syncNow(): Promise<void> {
    const accessToken = syncMetadataRef.current.accessToken;
    if (syncInFlightRef.current || !isHydrated || !state.user || !syncApiUrl || !syncStatus.isOnline || !accessToken) {
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
      const result = await syncSnapshot(syncApiUrl, state, accessToken, syncMetadataRef.current.lastSyncedAt);
      const metadata = {
        userSyncId: state.user.syncId,
        lastSyncedAt: result.syncedAt,
        lastSyncError: undefined,
        lastSyncedSignature: syncSignature,
      };

      syncMetadataRef.current = { ...metadata, accessToken };
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: false,
        hasConflict: false,
        lastSyncedAt: result.syncedAt,
        lastSyncError: undefined,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar.';
      const { accessToken: _, ...previousMetadata } = syncMetadataRef.current;
      const metadata = {
        ...previousMetadata,
        userSyncId: state.user.syncId,
        lastSyncError: message,
      };

      syncMetadataRef.current = { ...metadata, accessToken };
      await saveSyncMetadata(metadata);

      setSyncStatus((current) => ({
        ...current,
        isSyncing: false,
        syncEnabled: true,
        hasPendingChanges: true,
        hasConflict: error instanceof SyncConflictError,
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
        const [networkState, metadata, accessToken] = await Promise.all([manager.hydrate().then(() => Network.getNetworkStateAsync()), loadSyncMetadata(), loadAccessToken()]);

        syncMetadataRef.current = { ...metadata, accessToken: accessToken ?? undefined };

        if (mounted) {
          setSyncStatus((current) => ({
            ...current,
            isOnline: Boolean(networkState.isConnected && networkState.isInternetReachable !== false),
            syncEnabled: Boolean(syncApiUrl && accessToken),
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
        syncEnabled: Boolean(syncApiUrl && syncMetadataRef.current.accessToken),
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
      void clearAccessToken();
      setSyncStatus((current) => ({
        ...defaultSyncStatus,
        isOnline: current.isOnline,
        syncEnabled: Boolean(syncApiUrl && syncMetadataRef.current.accessToken),
      }));
      return;
    }

    const hasPendingChanges =
      syncMetadataRef.current.userSyncId !== state.user.syncId || syncMetadataRef.current.lastSyncedSignature !== syncSignature;
    const shouldRestoreRemoteState =
      Boolean(syncApiUrl && syncMetadataRef.current.accessToken) &&
      syncStatus.isOnline &&
      state.user.syncId !== remoteRestoreAttemptedRef.current &&
      state.habits.length === 0 &&
      state.checkIns.length === 0;

    setSyncStatus((current) => ({
      ...current,
      syncEnabled: Boolean(syncApiUrl && syncMetadataRef.current.accessToken),
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

  async function resolveSyncConflict(): Promise<boolean> {
    const syncId = state.user?.syncId;
    if (!syncId) return false;
    return Boolean(await restoreRemoteState(syncId));
  }

  async function loadDemoData(): Promise<AppStateSnapshot> {
    if (!state.user) {
      return state;
    }

    const nextHabitId = state.habits.reduce((highest, habit) => Math.max(highest, habit.id), 0) + 1;
    const now = new Date();
    const demoHabits: Habit[] = [
      { id: nextHabitId, name: 'Leitura consciente', description: 'Ler sem notificacoes por alguns minutos.', icon: 'book-open-page-variant', category: 'Estudo', frequency: 'daily', daysOfWeek: [], goalValue: '20', goalUnit: 'min', color: '#A855F7', isActive: true, createdAt: now.toISOString() },
      { id: nextHabitId + 1, name: 'Movimento matinal', description: 'Caminhada ou treino leve para iniciar o dia.', icon: 'run-fast', category: 'Saude', frequency: 'daily', daysOfWeek: [], goalValue: '30', goalUnit: 'min', color: '#10B981', isActive: true, createdAt: now.toISOString() },
      { id: nextHabitId + 2, name: 'Hidratacao', description: 'Manter agua por perto durante o dia.', icon: 'cup-water', category: 'Bem-estar', frequency: 'daily', daysOfWeek: [], goalValue: '8', goalUnit: 'copos', color: '#2563EB', isActive: true, createdAt: now.toISOString() },
    ];
    const newHabits = demoHabits.filter((habit) => !state.habits.some((existing) => existing.name === habit.name));

    if (newHabits.length === 0) {
      return state;
    }

    let nextCheckInId = state.checkIns.reduce((highest, checkIn) => Math.max(highest, checkIn.id), 0) + 1;
    const newCheckIns: CheckIn[] = [];
    for (let offset = -6; offset <= 0; offset += 1) {
      const date = todayString(addDays(now, offset));
      for (const habit of newHabits) {
        const value = habit.name === 'Hidratacao' ? Math.max(3, 8 + ((offset + 1) % 3) - 1) : habit.name === 'Movimento matinal' ? (offset % 3 === 0 ? 30 : 15) : offset % 4 === 0 ? 20 : 10;
        newCheckIns.push({
          id: nextCheckInId++,
          habitId: habit.id,
          habitName: habit.name,
          habitColor: habit.color,
          date,
          value,
          note: offset === 0 ? 'Registro de demonstracao.' : '',
          createdAt: addDays(now, offset).toISOString(),
        });
      }
    }

    return manager.replaceState({
      ...state,
      habits: [...state.habits, ...newHabits],
      checkIns: [...state.checkIns, ...newCheckIns],
    });
  }

  async function signOut(): Promise<AppStateSnapshot> {
    const accessToken = syncMetadataRef.current.accessToken;
    if (syncApiUrl && accessToken) {
      await revokeSession(syncApiUrl, accessToken).catch(() => undefined);
    }
    await clearAccessToken();
    await clearSyncMetadata();
    syncMetadataRef.current = {};
    return manager.signOut();
  }

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      isHydrated,
      syncStatus,
      signIn,
      authenticateLocal,
      syncNow,
      restoreRemoteState: resolveSyncConflict,
      loadDemoData,
      updateProfile: manager.updateProfile,
      signOut,
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
