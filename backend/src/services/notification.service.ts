import type { Types } from 'mongoose';
import { Notification, type NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';
import { sendPushToUser } from './fcm.service';

interface NotifyParams {
  recipientId: Types.ObjectId;
  actorId: string;
  actorUsername: string;
  type: NotificationType;
  postId: Types.ObjectId;
  /** Set for comment-scoped notifications (comment_like, reply, mention, and comment). */
  commentId?: Types.ObjectId;
  commentText?: string;
}

/**
 * Types where re-triggering the same (recipient, actor, type[, comment]) tuple
 * must not create a second notification — e.g. un-liking then re-liking.
 * Everything else (comment, reply, mention) is a distinct fact each time.
 */
const DEDUPED_TYPES: NotificationType[] = ['like', 'comment_like'];

const TITLES: Record<NotificationType, string> = {
  like: 'New like ❤️',
  comment: 'New comment 💬',
  comment_like: 'New like ❤️',
  reply: 'New reply 💬',
  mention: 'You were mentioned 📣',
};

function buildBody(type: NotificationType, actorUsername: string, commentText?: string): string {
  switch (type) {
    case 'like':
      return `@${actorUsername} liked your post`;
    case 'comment':
      return `@${actorUsername} commented: ${commentText ?? ''}`.slice(0, 200);
    case 'comment_like':
      return `@${actorUsername} liked your comment`;
    case 'reply':
      return `@${actorUsername} replied: ${commentText ?? ''}`.slice(0, 200);
    case 'mention':
      return `@${actorUsername} mentioned you: ${commentText ?? ''}`.slice(0, 200);
  }
}

/**
 * Records a notification and pushes it via FCM.
 * Skipped when a user interacts with their own content.
 * Fire-and-forget: callers should not await delivery, and failures only log.
 */
export async function notifyInteraction(params: NotifyParams): Promise<void> {
  const { recipientId, actorId, actorUsername, type, postId, commentId, commentText } = params;

  if (recipientId.toString() === actorId) return;

  try {
    if (DEDUPED_TYPES.includes(type)) {
      const existing = await Notification.findOne({
        recipient: recipientId,
        actor: actorId,
        type,
        post: postId,
        ...(commentId ? { comment: commentId } : {}),
      });
      if (existing) return;
    }

    await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      post: postId,
      ...(commentId ? { comment: commentId } : {}),
      ...(commentText ? { commentText } : {}),
    });

    await sendPushToUser(recipientId.toString(), {
      title: TITLES[type],
      body: buildBody(type, actorUsername, commentText),
      data: {
        type,
        postId: postId.toString(),
        ...(commentId ? { commentId: commentId.toString() } : {}),
      },
    });
  } catch (err) {
    console.error('[notification] failed to record/send notification:', err);
  }
}

// `@` must start the string or follow a non-word/non-`@` character, so
// "foo@example.com" doesn't extract "example" as a false-positive mention.
const MENTION_REGEX = /(?<=^|[^a-z0-9_@])@([a-z0-9_]{3,20})/gi;

interface NotifyMentionsParams {
  text: string;
  actorId: string;
  actorUsername: string;
  postId: Types.ObjectId;
  commentId?: Types.ObjectId;
}

/**
 * Parses `@username` tokens out of post/comment text, resolves them against
 * real users, and fires a 'mention' notification per resolved user (never
 * deduped — every mention is a distinct fact). Fire-and-forget, like
 * `notifyInteraction`.
 */
export async function notifyMentions(params: NotifyMentionsParams): Promise<void> {
  const { text, actorId, actorUsername, postId, commentId } = params;

  const usernames = new Set<string>();
  for (const match of text.matchAll(MENTION_REGEX)) {
    usernames.add(match[1].toLowerCase());
  }
  if (usernames.size === 0) return;

  try {
    const mentionedUsers = await User.find({ username: { $in: Array.from(usernames) } }).select(
      '_id'
    );
    const snippet = text.slice(0, 200);

    await Promise.all(
      mentionedUsers.map((u) =>
        notifyInteraction({
          recipientId: u._id,
          actorId,
          actorUsername,
          type: 'mention',
          postId,
          commentId,
          commentText: snippet,
        })
      )
    );
  } catch (err) {
    console.error('[notification] failed to process mentions:', err);
  }
}
