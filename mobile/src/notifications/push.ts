import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { STORAGE_KEYS, storage } from '../auth/storage';

/** How notifications behave when the app is in the foreground. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and registers this device's native FCM token with the
 * backend. No-ops (returns false) on web, simulators, in Expo Go on Android,
 * or when permission is denied — the app works fine without push.
 */
export async function registerDeviceForPush(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false;

  try {
    if (Platform.OS === 'android') {
      // Required before requesting permission on Android 13+.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Social activity',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
    if (typeof fcmToken !== 'string' || !fcmToken) return false;

    await api.put('/api/users/me/fcm-token', { token: fcmToken });
    await storage.set(STORAGE_KEYS.fcmToken, fcmToken);
    return true;
  } catch (err) {
    // Expected in Expo Go / builds without google-services.json.
    console.warn('[push] registration skipped:', err);
    return false;
  }
}

/** Detaches this device's token on logout so the next user isn't notified. */
export async function unregisterDeviceForPush(): Promise<void> {
  try {
    const fcmToken = await storage.get(STORAGE_KEYS.fcmToken);
    if (fcmToken) {
      await api.delete('/api/users/me/fcm-token', { data: { token: fcmToken } });
      await storage.remove(STORAGE_KEYS.fcmToken);
    }
  } catch {
    // Best effort — never block logout.
  }
}

/** Pulls the postId a notification points at, if any. */
export function postIdFromNotification(
  response: Notifications.NotificationResponse | null
): string | null {
  const data = response?.notification.request.content.data as
    | { postId?: string }
    | undefined;
  return typeof data?.postId === 'string' ? data.postId : null;
}
