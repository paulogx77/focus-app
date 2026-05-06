import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppState } from '../context/AppStateContext';
import AddHabitScreen from '../screens/AddHabitScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitsScreen from '../screens/HabitsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
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
  const iconMap: Record<keyof BottomTabParamList, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    Hoje: 'calendar-today',
    Hábitos: 'format-list-checks',
    Dashboard: 'chart-box-outline',
    Histórico: 'history',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={iconMap[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Hoje" component={TodayScreen} />
      <Tab.Screen name="Hábitos" component={HabitsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

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
