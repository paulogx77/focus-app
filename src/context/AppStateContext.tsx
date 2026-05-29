import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AppStateManager } from '../state/AppStateManager';
import { createAppStateRepository } from '../storage/createAppStateRepository';
import { initialState } from '../storage/AppStateStorage';
import type { AppStateContextValue, AppStateSnapshot } from '../types';

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  const repository = useMemo(() => createAppStateRepository(), []);
  const manager = useMemo(() => new AppStateManager(repository, setState), [repository]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await manager.hydrate();
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
  }, [manager]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      isHydrated,
      signIn: manager.signIn,
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
    [state, isHydrated, manager]
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
