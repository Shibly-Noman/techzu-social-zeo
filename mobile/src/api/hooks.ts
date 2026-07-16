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

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post(`/api/posts/${postId}/comment`, { text });
      return data.data.comment as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ── Notifications ─────────────────────────────────────────────────────

export function useNotifications() {
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
