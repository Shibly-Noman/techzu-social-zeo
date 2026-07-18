import type { Types } from 'mongoose';
import type { IComment } from '../models/comment.model';

interface PopulatedAuthor {
  _id: Types.ObjectId;
  username: string;
}

/** Shared comment response shape — used for top-level comments, replies, and new-comment responses alike. */
export function serializeComment(comment: IComment, viewerId: string) {
  const author = comment.author as unknown as PopulatedAuthor;
  return {
    id: comment._id.toString(),
    text: comment.text,
    author: { id: author._id.toString(), username: author.username },
    postId: comment.post.toString(),
    parentId: comment.parentComment ? comment.parentComment.toString() : null,
    likeCount: comment.likes.length,
    likedByMe: comment.likes.some((id) => id.toString() === viewerId),
    replyCount: comment.replyCount,
    createdAt: comment.createdAt,
  };
}
