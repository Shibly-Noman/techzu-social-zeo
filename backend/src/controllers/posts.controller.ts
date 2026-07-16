import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { Comment } from '../models/comment.model';
import { Post, type IPost } from '../models/post.model';
import { User } from '../models/user.model';
import { notifyInteraction } from '../services/notification.service';
import { ApiError } from '../utils/apiError';
import type { FeedQuery, Pagination } from '../schemas';

interface PopulatedAuthor {
  _id: Types.ObjectId;
  username: string;
}

function serializePost(post: IPost, viewerId: string) {
  const author = post.author as unknown as PopulatedAuthor;
  return {
    id: post._id.toString(),
    text: post.text,
    author: { id: author._id.toString(), username: author.username },
    likeCount: post.likes.length,
    commentCount: post.commentCount,
    likedByMe: post.likes.some((id) => id.toString() === viewerId),
    createdAt: post.createdAt,
  };
}

export async function createPost(req: Request, res: Response) {
  const { text } = req.body as { text: string };
  const post = await Post.create({ author: req.userId, text });
  await post.populate('author', 'username');
  res.status(201).json({ success: true, data: { post: serializePost(post, req.userId) } });
}

export async function getFeed(req: Request, res: Response) {
  const { page, limit, username } = req.validatedQuery as FeedQuery;

  const filter: Record<string, unknown> = {};
  if (username) {
    // Prefix match so partial typing in the search box still finds users.
    const authors = await User.find({ username: { $regex: `^${escapeRegex(username)}` } }).select(
      '_id'
    );
    if (authors.length === 0) {
      return res.json({
        success: true,
        data: { posts: [], page, limit, total: 0, hasMore: false },
      });
    }
    filter.author = { $in: authors.map((a) => a._id) };
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username'),
    Post.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      posts: posts.map((p) => serializePost(p, req.userId)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  });
}

export async function getPost(req: Request, res: Response) {
  const post = await Post.findById(req.params.id).populate('author', 'username');
  if (!post) throw ApiError.notFound('Post not found');
  res.json({ success: true, data: { post: serializePost(post, req.userId) } });
}

export async function toggleLike(req: Request, res: Response) {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const alreadyLiked = post.likes.some((id) => id.toString() === req.userId);
  const update = alreadyLiked
    ? { $pull: { likes: req.userId } }
    : { $addToSet: { likes: req.userId } };

  const updated = await Post.findByIdAndUpdate(post._id, update, { new: true });
  if (!updated) throw ApiError.notFound('Post not found');

  if (!alreadyLiked) {
    // Fire-and-forget: delivery must not block or fail the request.
    void notifyInteraction({
      recipientId: post.author,
      actorId: req.userId,
      actorUsername: req.username,
      type: 'like',
      postId: post._id,
    });
  }

  res.json({
    success: true,
    data: { liked: !alreadyLiked, likeCount: updated.likes.length },
  });
}

export async function addComment(req: Request, res: Response) {
  const { text } = req.body as { text: string };

  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const comment = await Comment.create({ post: post._id, author: req.userId, text });
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  await comment.populate('author', 'username');

  void notifyInteraction({
    recipientId: post.author,
    actorId: req.userId,
    actorUsername: req.username,
    type: 'comment',
    postId: post._id,
    commentText: text,
  });

  const author = comment.author as unknown as PopulatedAuthor;
  res.status(201).json({
    success: true,
    data: {
      comment: {
        id: comment._id.toString(),
        text: comment.text,
        author: { id: author._id.toString(), username: author.username },
        postId: post._id.toString(),
        createdAt: comment.createdAt,
      },
    },
  });
}

export async function getComments(req: Request, res: Response) {
  const { page, limit } = req.validatedQuery as Pagination;

  const post = await Post.findById(req.params.id).select('_id');
  if (!post) throw ApiError.notFound('Post not found');

  const [comments, total] = await Promise.all([
    Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username'),
    Comment.countDocuments({ post: post._id }),
  ]);

  res.json({
    success: true,
    data: {
      comments: comments.map((c) => {
        const author = c.author as unknown as PopulatedAuthor;
        return {
          id: c._id.toString(),
          text: c.text,
          author: { id: author._id.toString(), username: author.username },
          postId: c.post.toString(),
          createdAt: c.createdAt,
        };
      }),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
