import 'react-native-gesture-handler';

import type { ComponentType, ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from './src/context/AppStateContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

const GestureRoot = GestureHandlerRootView as unknown as ComponentType<{
  style: unknown;
  children: ReactNode;
}>;

export default function App() {
  return (
    <GestureRoot style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <AppNavigator />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureRoot>
  );
}
