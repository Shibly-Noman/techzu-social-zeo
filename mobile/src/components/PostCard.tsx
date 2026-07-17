import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../api/types';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';
import { relativeTime } from '../utils/relativeTime';
import { Avatar } from './Avatar';
import { GlassSurface } from './GlassSurface';
import { PostComments } from './PostComments';

interface Props {
  post: Post;
  onToggleLike: (postId: string) => void;
  onPressAuthor?: (username: string) => void;
  /**
   * Whether tapping the comment button expands an inline thread in place.
   * Set to false on the post detail page, which already shows the full
   * thread below and doesn't need its own toggle.
   */
  commentsInline?: boolean;
}

const useNative = Platform.OS !== 'web';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      padding: spacing.lg,
      marginBottom: spacing.md,
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
      flexShrink: 1,
      minWidth: 0,
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
}

export const PostCard = React.memo(function PostCard({
  post,
  onToggleLike,
  onPressAuthor,
  commentsInline = true,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const heartScale = useRef(new Animated.Value(1)).current;
  const [commentsOpen, setCommentsOpen] = useState(false);

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
    <GlassSurface style={styles.card} radius={radius.lg}>
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
            <Text style={styles.username} numberOfLines={1}>
              @{post.author.username}
            </Text>
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
          onPress={commentsInline ? () => setCommentsOpen((open) => !open) : undefined}
          android_ripple={commentsInline ? { color: colors.ripple, borderless: true, radius: 28 } : undefined}
          accessibilityRole="button"
          accessibilityLabel={commentsOpen ? 'Hide comments' : 'View comments'}
          hitSlop={8}
        >
          <Ionicons
            name={commentsInline && commentsOpen ? 'chatbubble' : 'chatbubble-outline'}
            size={20}
            color={commentsInline && commentsOpen ? colors.primary : colors.textMuted}
          />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
      </View>

      {commentsInline && commentsOpen ? <PostComments postId={post.id} /> : null}
    </GlassSurface>
  );
});
