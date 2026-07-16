import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { Notification } from '../models/notification.model';
import type { Pagination } from '../schemas';

export async function getNotifications(req: Request, res: Response) {
  const { page, limit } = req.validatedQuery as Pagination;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actor', 'username')
      .populate('post', 'text'),
    Notification.countDocuments({ recipient: req.userId }),
    Notification.countDocuments({ recipient: req.userId, read: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications: notifications.map((n) => {
        const actor = n.actor as unknown as { _id: Types.ObjectId; username: string };
        const post = n.post as unknown as { _id: Types.ObjectId; text: string } | null;
        return {
          id: n._id.toString(),
          type: n.type,
          actor: { id: actor._id.toString(), username: actor.username },
          post: post
            ? { id: post._id.toString(), text: post.text.slice(0, 80) }
            : null,
          commentText: n.commentText ?? null,
          read: n.read,
          createdAt: n.createdAt,
        };
      }),
      page,
      limit,
      total,
      unreadCount,
      hasMore: page * limit < total,
    },
  });
}

/** Marks all of the user's notifications as read (clears the badge). */
export async function markAllRead(req: Request, res: Response) {
  await Notification.updateMany({ recipient: req.userId, read: false }, { $set: { read: true } });
  res.json({ success: true, data: { read: true } });
}
