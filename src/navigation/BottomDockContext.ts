import { createContext, useContext } from 'react';

type BottomDockContextValue = {
  setHidden: (hidden: boolean) => void;
};

export const BottomDockContext = createContext<BottomDockContextValue | null>(null);

export function useBottomDock(): BottomDockContextValue | null {
  return useContext(BottomDockContext);
}
