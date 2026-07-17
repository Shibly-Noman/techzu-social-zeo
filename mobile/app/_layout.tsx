import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth/AuthContext';
import { SPLASH_DURATION_MS, SplashAnimation } from '../src/components/SplashAnimation';
import { ToastProvider } from '../src/components/Toast';
import { colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
    },
  },
});

const SPLASH_FADE_MS = 400;

// Keep the native static splash up until we can swap in the animated one below.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hand off from the native splash to the Lottie splash as soon as JS is ready.
    void SplashScreen.hideAsync();

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(() => setSplashVisible(false));
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [splashOpacity]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            {/* Edge-to-edge Android: dark icons; the app background shows through. */}
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
            {splashVisible ? (
              <Animated.View
                style={[styles.splashOverlay, { opacity: splashOpacity }]}
                pointerEvents="none"
              >
                <SplashAnimation />
              </Animated.View>
            ) : null}
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
