import type { Types } from 'mongoose';
import { Notification, type NotificationType } from '../models/notification.model';
import { sendPushToUser } from './fcm.service';

interface NotifyParams {
  recipientId: Types.ObjectId;
  actorId: string;
  actorUsername: string;
  type: NotificationType;
  postId: Types.ObjectId;
  commentText?: string;
}

/**
 * Records a notification and pushes it via FCM.
 * Skipped when a user interacts with their own post.
 * Fire-and-forget: callers should not await delivery, and failures only log.
 */
export async function notifyInteraction(params: NotifyParams): Promise<void> {
  const { recipientId, actorId, actorUsername, type, postId, commentText } = params;

  if (recipientId.toString() === actorId) return;

  try {
    // Dedupe likes: un-liking and re-liking the same post must not
    // notify (and push) again.
    if (type === 'like') {
      const existing = await Notification.findOne({
        recipient: recipientId,
        actor: actorId,
        type: 'like',
        post: postId,
      });
      if (existing) return;
    }

    await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      post: postId,
      ...(commentText ? { commentText } : {}),
    });

    const title = type === 'like' ? 'New like ❤️' : 'New comment 💬';
    const body =
      type === 'like'
        ? `@${actorUsername} liked your post`
        : `@${actorUsername} commented: ${commentText ?? ''}`.slice(0, 200);

    await sendPushToUser(recipientId.toString(), {
      title,
      body,
      data: { type, postId: postId.toString() },
    });
  } catch (err) {
    console.error('[notification] failed to record/send notification:', err);
  }
}
