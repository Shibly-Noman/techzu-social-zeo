export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface PostAuthor {
  id: string;
  username: string;
}

export interface Post {
  id: string;
  text: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  author: PostAuthor;
  postId: string;
  parentId: string | null;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  createdAt: string;
}

export type NotificationType = 'like' | 'comment' | 'comment_like' | 'reply' | 'mention';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: PostAuthor;
  post: { id: string; text: string } | null;
  comment: { id: string; text: string } | null;
  commentText: string | null;
  read: boolean;
  createdAt: string;
}

export interface FeedPage {
  posts: Post[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface CommentsPage {
  comments: Comment[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface RepliesPage {
  replies: Comment[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface NotificationsPage {
  notifications: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserSummary {
  id: string;
  username: string;
}

export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
  postCount: number;
}
