import * as Notifications from 'expo-notifications';
import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../../src/auth/AuthContext';
import { LoadingView } from '../../src/components/StatusViews';
import { postIdFromNotification, registerDeviceForPush } from '../../src/notifications/push';

export default function AppLayout() {
  const { status } = useAuth();
  const router = useRouter();

  // Register this device for push once the user is signed in.
  useEffect(() => {
    if (status === 'signedIn') {
      void registerDeviceForPush();
    }
  }, [status]);

  // Tapping a push notification deep-links to the post it refers to.
  useEffect(() => {
    if (status !== 'signedIn') return;

    // App launched from a notification (cold start).
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const postId = postIdFromNotification(response);
      if (postId) router.push(`/(app)/post/${postId}`);
    });

    // App already running.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const postId = postIdFromNotification(response);
      if (postId) router.push(`/(app)/post/${postId}`);
    });
    return () => sub.remove();
  }, [status, router]);

  if (status === 'loading') return <LoadingView />;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
    </Stack>
  );
}
