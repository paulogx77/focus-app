import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../context/AppStateContext';
import AddHabitScreen from '../screens/AddHabitScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitsScreen from '../screens/HabitsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TodayScreen from '../screens/TodayScreen';
import { colors } from '../theme';
import type { BottomTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const insets = useSafeAreaInsets();
  const iconMap: Record<keyof BottomTabParamList, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    Hoje: 'calendar-today',
    Hábitos: 'format-list-checks',
    Dashboard: 'chart-box-outline',
    Histórico: 'history',
    Perfil: 'account-circle-outline',
  };

  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(10, insets.bottom + 6),
          backgroundColor: colors.surfaceGlassStrong,
          borderTopColor: colors.borderGlass,
          borderColor: colors.borderGlass,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 26,
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(10, insets.bottom + 8),
          shadowColor: '#000',
          shadowOpacity: 0.24,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
            <MaterialCommunityIcons name={iconMap[route.name]} size={size - 1} color={focused ? colors.textPrimary : color} />
          </View>
        ),
        tabBarLabel: ({ color, focused, children }) => (
          <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>{children}</Text>
        ),
      })}
    >
      <Tab.Screen name="Hoje" component={TodayScreen} />
      <Tab.Screen name="Hábitos" component={HabitsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
