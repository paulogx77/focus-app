import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../context/AppStateContext';
import AddHabitScreen from '../screens/AddHabitScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitsScreen from '../screens/HabitsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TodayScreen from '../screens/TodayScreen';
import { BottomDockContext } from './BottomDockContext';
import { colors } from '../theme';
import type { BottomTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const iconMap: Record<keyof BottomTabParamList, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Hoje: 'calendar-today',
  Hábitos: 'format-list-checks',
  Dashboard: 'chart-box-outline',
  Histórico: 'history',
  Perfil: 'account-circle-outline',
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.textPrimary,
    primary: colors.primaryLight,
  },
};

function Tabs() {
  const [dockHidden, setDockHidden] = useState(false);

  return (
    <BottomDockContext.Provider value={{ setHidden: setDockHidden }}>
      <Tab.Navigator
        id="main-tabs"
        screenListeners={{ tabPress: () => setDockHidden(false) }}
        tabBar={(props) => <FloatingTabBar {...props} hidden={dockHidden} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Hoje" component={TodayScreen} />
        <Tab.Screen name="Hábitos" component={HabitsScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Histórico" component={HistoryScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </BottomDockContext.Provider>
  );
}

function FloatingTabBar({ state, descriptors, navigation, hidden }: BottomTabBarProps & { hidden: boolean }) {
  const insets = useSafeAreaInsets();
  const visibility = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(visibility, {
      toValue: hidden ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [hidden, visibility]);

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      style={[
        styles.tabBar,
        { bottom: Math.max(10, insets.bottom + 6), paddingBottom: Math.max(10, insets.bottom + 8) },
        {
          opacity: visibility.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [0, 110] }) }],
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const color = focused ? colors.primaryLight : colors.textSecondary;

        function handlePress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        }

        return (
          <Pressable key={route.key} onPress={handlePress} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={options.tabBarAccessibilityLabel} style={styles.tabItem}>
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <MaterialCommunityIcons name={iconMap[route.name as keyof BottomTabParamList]} size={21} color={focused ? colors.textPrimary : color} />
            </View>
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: colors.surfaceGlassStrong,
    borderTopColor: colors.borderGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderTopWidth: 1,
    borderRadius: 26,
    height: 82,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIconWrap: {
    minWidth: 42,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: `${colors.primary}CC`,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
});

export default function AppNavigator() {
  const { user, isHydrated } = useAppState();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primaryLight} />
      </View>
    );
  }

  if (!user?.name) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        id="root-stack"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={Tabs} />
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
