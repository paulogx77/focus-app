import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loadState, saveState } from '../storage/localStore';
import { todayString } from '../utils/date';

const AppStateContext = createContext(null);

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function createStateUpdater(setState) {
  return async (updater) => {
    let nextState;
    setState((previous) => {
      nextState = updater(previous);
      return nextState;
    });
    await saveState(nextState);
    return nextState;
  };
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState({ user: null, habits: [], checkIns: [] });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const stored = await loadState();
      if (!mounted) return;
      setState(stored);
      setIsHydrated(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updateState = useMemo(() => createStateUpdater(setState), []);

  const actions = useMemo(
    () => ({
      signIn: async (name) =>
        updateState((previous) => ({
          ...previous,
          user: { name },
        })),
      signOut: async () =>
        updateState((previous) => ({
          ...previous,
          user: null,
        })),
      addHabit: async (habit) =>
        updateState((previous) => ({
          ...previous,
          habits: [
            ...previous.habits,
            {
              id: nextId(previous.habits),
              createdAt: new Date().toISOString(),
              isActive: true,
              ...habit,
            },
          ],
        })),
      updateHabit: async (habitId, payload) =>
        updateState((previous) => ({
          ...previous,
          habits: previous.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  ...payload,
                }
              : habit
          ),
        })),
      toggleHabitActive: async (habitId) =>
        updateState((previous) => ({
          ...previous,
          habits: previous.habits.map((habit) =>
            habit.id === habitId ? { ...habit, isActive: !habit.isActive } : habit
          ),
        })),
      deleteHabit: async (habitId) =>
        updateState((previous) => ({
          ...previous,
          habits: previous.habits.filter((habit) => habit.id !== habitId),
          checkIns: previous.checkIns.filter((checkIn) => checkIn.habitId !== habitId),
        })),
      toggleCheckIn: async (habitId, date = todayString()) =>
        updateState((previous) => {
          const exists = previous.checkIns.some(
            (checkIn) => checkIn.habitId === habitId && checkIn.date === date
          );

          return {
            ...previous,
            checkIns: exists
              ? previous.checkIns.filter(
                  (checkIn) => !(checkIn.habitId === habitId && checkIn.date === date)
                )
              : [
                  ...previous.checkIns,
                  {
                    id: nextId(previous.checkIns),
                    habitId,
                    date,
                    value: 1,
                    createdAt: new Date().toISOString(),
                  },
                ],
          };
        }),
      resetCheckIns: async () =>
        updateState((previous) => ({
          ...previous,
          checkIns: [],
        })),
    }),
    [updateState]
  );

  const value = useMemo(
    () => ({
      ...state,
      isHydrated,
      ...actions,
      setState,
    }),
    [state, isHydrated, actions]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
