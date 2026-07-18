import { Ionicons } from '@expo/vector-icons';
import type { NotificationType } from '../api/types';

export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; label: string; heart: boolean }
> = {
  like: { icon: 'heart', label: ' liked your post', heart: true },
  comment: { icon: 'chatbubble', label: ' commented on your post', heart: false },
  comment_like: { icon: 'heart', label: ' liked your comment', heart: true },
  reply: { icon: 'chatbubble-ellipses', label: ' replied to your comment', heart: false },
  mention: { icon: 'at', label: ' mentioned you', heart: false },
};
