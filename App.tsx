import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './src/database/database';
import TodayScreen from './src/screens/TodayScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';



// Placeholders

const DashboardScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#7C3AED', fontSize: 24, fontWeight: 'bold' }}>Dashboard 📊</Text>
  </View>
);
const HistoryScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#7C3AED', fontSize: 24, fontWeight: 'bold' }}>Histórico 🕐</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      initDatabase()
        .then(() => setDbReady(true))
        .catch((err) => {
          console.error(err);
          setError(String(err));
        });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' }}>
      <Text style={{ color: 'red', padding: 20, textAlign: 'center' }}>{error}</Text>
    </View>
  );

  if (!dbReady) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0F0F1A' }}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: { backgroundColor: '#1A1A2E', borderTopColor: '#2A2A3E' },
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#555',
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = {
              Hoje: 'checkmark-circle',
              Hábitos: 'calendar',
              Dashboard: 'bar-chart',
              Histórico: 'time',
            };
            return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Hoje" component={TodayScreen} />
        <Tab.Screen name="Hábitos" component={HabitsScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Histórico" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}