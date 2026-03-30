import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './src/i18n';
import { queryClient } from './src/lib/queryClient';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme, useThemeMode } from './src/contexts/ThemeContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { isDemoMode } from './src/api/apiClient';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const { isDark } = useThemeMode();

  // Build React Navigation theme from our app theme
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme, isDark]);

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.splashText}>UOH Meetings</Text>
      </View>
    );
  }

  return (
    <>
      {isDemoMode() && (
        <View style={[styles.demoBanner, { backgroundColor: theme.colors.warning }]}>
          <Text style={styles.demoText}>Demo Mode</Text>
        </View>
      )}
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

function StatusBarWrapper() {
  const { isDark } = useThemeMode();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <RootNavigator />
              <StatusBarWrapper />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  demoBanner: { paddingVertical: 4, alignItems: 'center' },
  demoText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
