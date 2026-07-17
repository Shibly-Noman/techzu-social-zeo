import { Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '../src/auth/AuthContext';
import { LoadingView } from '../src/components/StatusViews';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingView />;
  return <Redirect href={status === 'signedIn' ? '/(app)/(tabs)' : '/(auth)/welcome'} />;
}
