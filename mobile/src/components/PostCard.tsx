import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

const useNative = Platform.OS !== 'web';

export const PostCard = React.memo(function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onPressAuthor,
}: Props) {
  const heartScale = useRef(new Animated.Value(1)).current;

  function handleLikePress() {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.35,
        speed: 40,
        bounciness: 14,
        useNativeDriver: useNative,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        speed: 40,
        bounciness: 10,
        useNativeDriver: useNative,
      }),
    ]).start();
    onToggleLike(post.id);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.authorRow}
          onPress={() => onPressAuthor?.(post.author.username)}
          android_ripple={{ color: colors.ripple }}
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
          onPress={handleLikePress}
          android_ripple={{ color: colors.ripple, borderless: true, radius: 28 }}
          accessibilityRole="button"
          accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
          hitSlop={8}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={post.likedByMe ? 'heart' : 'heart-outline'}
              size={22}
              color={post.likedByMe ? colors.like : colors.textMuted}
            />
          </Animated.View>
          <Text style={[styles.actionCount, post.likedByMe && styles.likedCount]}>
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={() => onOpenComments(post.id)}
          android_ripple={{ color: colors.ripple, borderless: true, radius: 28 }}
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
    borderRadius: radius.md,
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
