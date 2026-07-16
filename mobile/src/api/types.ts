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
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment';
  actor: PostAuthor;
  post: { id: string; text: string } | null;
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
