import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../api/types';
import { colors, radius, spacing } from '../theme';
import { relativeTime } from '../utils/relativeTime';
import { Avatar } from './Avatar';

interface Props {
  post: Post;
  onToggleLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onPressAuthor?: (username: string) => void;
}

export const PostCard = React.memo(function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onPressAuthor,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.authorRow}
          onPress={() => onPressAuthor?.(post.author.username)}
          accessibilityRole="button"
          accessibilityLabel={`Filter posts by ${post.author.username}`}
        >
          <Avatar username={post.author.username} />
          <View style={styles.authorMeta}>
            <Text style={styles.username}>@{post.author.username}</Text>
            <Text style={styles.time}>{relativeTime(post.createdAt)}</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.text}>{post.text}</Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={() => onToggleLike(post.id)}
          accessibilityRole="button"
          accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
          hitSlop={8}
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={22}
            color={post.likedByMe ? colors.like : colors.textMuted}
          />
          <Text style={[styles.actionCount, post.likedByMe && styles.likedCount]}>
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={() => onOpenComments(post.id)}
          accessibilityRole="button"
          accessibilityLabel="View comments"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorMeta: {
    marginLeft: spacing.md,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 32,
  },
  actionCount: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  likedCount: {
    color: colors.like,
  },
});
