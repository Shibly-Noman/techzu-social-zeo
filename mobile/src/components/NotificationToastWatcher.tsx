import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useNotifications } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme';
import { NOTIFICATION_META } from '../utils/notificationMeta';
import { useToast } from './Toast';

/**
 * Renders nothing — piggybacks on the notifications feed's existing 30s poll
 * (shared query cache, so this adds no extra network traffic) and pops an
 * in-app toast the moment a new, unread notification shows up, on any screen.
 */
export function NotificationToastWatcher() {
  const { status } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const query = useNotifications(status === 'signedIn');

  const lastSeenId = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (status !== 'signedIn') {
      initialized.current = false;
      lastSeenId.current = null;
      return;
    }

    const latest = query.data?.pages[0]?.notifications[0];
    if (!latest) return;

    if (!initialized.current) {
      // First load after sign-in: record the current top item, but don't
      // toast for notifications that already existed before this mount.
      lastSeenId.current = latest.id;
      initialized.current = true;
      return;
    }

    if (latest.id !== lastSeenId.current) {
      lastSeenId.current = latest.id;
      if (!latest.read) {
        const meta = NOTIFICATION_META[latest.type];
        toast.show(`@${latest.actor.username}${meta.label}`, {
          icon: meta.heart ? 'heart' : 'notifications',
          iconColor: meta.heart ? colors.like : colors.primary,
          onPress: latest.post
            ? () => router.push(`/(app)/post/${latest.post!.id}`)
            : undefined,
        });
      }
    }
  }, [status, query.data, toast, router, colors]);

  return null;
}
