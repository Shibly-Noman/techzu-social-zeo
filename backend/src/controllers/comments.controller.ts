import type { Request, Response } from 'express';
import { Comment } from '../models/comment.model';
import { notifyInteraction } from '../services/notification.service';
import { ApiError } from '../utils/apiError';
import { serializeComment } from '../utils/serializers';
import type { Pagination } from '../schemas';

export async function toggleCommentLike(req: Request, res: Response) {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const alreadyLiked = comment.likes.some((id) => id.toString() === req.userId);
  const update = alreadyLiked
    ? { $pull: { likes: req.userId } }
    : { $addToSet: { likes: req.userId } };

  const updated = await Comment.findByIdAndUpdate(comment._id, update, { new: true });
  if (!updated) throw ApiError.notFound('Comment not found');

  if (!alreadyLiked) {
    void notifyInteraction({
      recipientId: comment.author,
      actorId: req.userId,
      actorUsername: req.username,
      type: 'comment_like',
      postId: comment.post,
      commentId: comment._id,
    });
  }

  res.json({
    success: true,
    data: { liked: !alreadyLiked, likeCount: updated.likes.length },
  });
}

export async function getReplies(req: Request, res: Response) {
  const { page, limit } = req.validatedQuery as Pagination;

  const parent = await Comment.findById(req.params.commentId).select('_id');
  if (!parent) throw ApiError.notFound('Comment not found');

  const [replies, total] = await Promise.all([
    Comment.find({ parentComment: parent._id })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username'),
    Comment.countDocuments({ parentComment: parent._id }),
  ]);

  res.json({
    success: true,
    data: {
      replies: replies.map((r) => serializeComment(r, req.userId)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  });
}
