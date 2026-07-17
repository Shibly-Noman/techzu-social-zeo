import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '../../src/auth/AuthContext';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'signedIn') return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
    </Stack>
  );
}
