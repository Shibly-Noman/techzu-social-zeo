import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { api } from './client';
import type {
  Comment,
  CommentsPage,
  FeedPage,
  NotificationsPage,
  Post,
  RepliesPage,
  UserProfile,
  UserSummary,
} from './types';

const PAGE_SIZE = 10;

// ── Feed ──────────────────────────────────────────────────────────────

export function useFeed(username: string) {
  return useInfiniteQuery({
    queryKey: ['feed', username],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/api/posts', {
        params: { page: pageParam, limit: PAGE_SIZE, ...(username ? { username } : {}) },
      });
      return data.data as FeedPage;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post('/api/posts', { text });
      return data.data.post as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ── Likes (optimistic toggle) ─────────────────────────────────────────

function togglePostInPage(page: FeedPage, postId: string): FeedPage {
  return {
    ...page,
    posts: page.posts.map((p) =>
      p.id === postId
        ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
        : p
    ),
  };
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/api/posts/${postId}/like`);
      return data.data as { liked: boolean; likeCount: number };
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
        queryKey: ['feed'],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<FeedPage>>(key, {
          ...data,
          pages: data.pages.map((page) => togglePostInPage(page, postId)),
        });
      }
      // Keep the detail view in sync too.
      const detail = queryClient.getQueryData<Post>(['post', postId]);
      if (detail) {
        queryClient.setQueryData<Post>(['post', postId], {
          ...detail,
          likedByMe: !detail.likedByMe,
          likeCount: detail.likeCount + (detail.likedByMe ? -1 : 1),
        });
      }
      return { snapshots, detail };
    },
    onError: (_err, _postId, context) => {
      // Roll back the optimistic update.
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      if (context?.detail) {
        queryClient.setQueryData(['post', context.detail.id], context.detail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ── Single post + comments ────────────────────────────────────────────

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${postId}`);
      return data.data.post as Post;
    },
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/api/posts/${postId}/comments`, {
        params: { page: pageParam, limit: 20 },
      });
      return data.data as CommentsPage;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useReplies(commentId: string) {
  return useInfiniteQuery({
    queryKey: ['replies', commentId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/api/comments/${commentId}/replies`, {
        params: { page: pageParam, limit: 20 },
      });
      return data.data as RepliesPage;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, parentCommentId }: { text: string; parentCommentId?: string }) => {
      const { data } = await api.post(`/api/posts/${postId}/comment`, { text, parentCommentId });
      return data.data.comment as Comment;
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      if (comment.parentId) {
        queryClient.invalidateQueries({ queryKey: ['replies', comment.parentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ── Comment reactions (optimistic toggle across comment + reply caches) ─

function toggleCommentLikeInList(comments: Comment[], commentId: string): Comment[] {
  return comments.map((c) =>
    c.id === commentId
      ? { ...c, likedByMe: !c.likedByMe, likeCount: c.likeCount + (c.likedByMe ? -1 : 1) }
      : c
  );
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.post(`/api/comments/${commentId}/like`);
      return data.data as { liked: boolean; likeCount: number };
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments'] });
      await queryClient.cancelQueries({ queryKey: ['replies'] });

      const commentSnapshots = queryClient.getQueriesData<InfiniteData<CommentsPage>>({
        queryKey: ['comments'],
      });
      for (const [key, data] of commentSnapshots) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<CommentsPage>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            comments: toggleCommentLikeInList(page.comments, commentId),
          })),
        });
      }

      const replySnapshots = queryClient.getQueriesData<InfiniteData<RepliesPage>>({
        queryKey: ['replies'],
      });
      for (const [key, data] of replySnapshots) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<RepliesPage>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            replies: toggleCommentLikeInList(page.replies, commentId),
          })),
        });
      }

      return { commentSnapshots, replySnapshots };
    },
    onError: (_err, _commentId, context) => {
      for (const [key, data] of context?.commentSnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context?.replySnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
  });
}

// ── Profile ───────────────────────────────────────────────────────────

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${username}`);
      return data.data.user as UserProfile;
    },
    enabled: username.length > 0,
  });
}

/** Exact-match post list for a profile page — distinct cache key from the
 * search box's prefix-match `useFeed` so the two never collide. */
export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['userPosts', username],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/api/posts', {
        params: { page: pageParam, limit: PAGE_SIZE, username, exact: true },
      });
      return data.data as FeedPage;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: username.length > 0,
  });
}

// ── Mention autocomplete ────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: async () => {
      const { data } = await api.get('/api/users/search', { params: { q: query } });
      return data.data.users as UserSummary[];
    },
    enabled: query.length > 0,
    staleTime: 30000,
  });
}

// ── Notifications ─────────────────────────────────────────────────────

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/api/notifications', {
        params: { page: pageParam, limit: 20 },
      });
      return data.data as NotificationsPage;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    refetchInterval: 30000,
    enabled,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/notifications/mark-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
