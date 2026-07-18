import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReplies, useToggleCommentLike } from '../api/hooks';
import type { Comment } from '../api/types';
import { useTextTruncation } from '../hooks/useTextTruncation';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';
import { relativeTime } from '../utils/relativeTime';
import { Avatar } from './Avatar';
import { GlassSurface } from './GlassSurface';
import { MentionText } from './MentionText';

export interface ReplyTarget {
  commentId: string;
  username: string;
}

/** Comment text collapses to this many lines before offering "See more", same as post text. */
const MAX_TEXT_LINES = 2;

function createStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    rowNested: {
      marginLeft: 20,
      marginTop: spacing.sm,
      marginBottom: 0,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    bubble: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignSelf: 'flex-start',
    },
    author: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    text: {
      fontSize: 14,
      color: colors.text,
      marginTop: 1,
      lineHeight: 19,
    },
    measureText: {
      position: 'absolute',
      opacity: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
    },
    seeMore: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: 4,
      marginLeft: spacing.sm,
    },
    time: {
      fontSize: 11,
      color: colors.textMuted,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    actionTextActive: {
      color: colors.like,
    },
    viewReplies: {
      marginTop: spacing.sm,
      marginLeft: 20,
    },
    viewRepliesText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    spinner: {
      marginLeft: 20,
      marginTop: spacing.sm,
    },
  });
}

interface CommentRowProps {
  comment: Comment;
  /** Replies are rendered one level deep — no Reply button, no nested "view replies". */
  isReply?: boolean;
  /** Top-level only: bubbles the tap up so the screen's single composer can target this comment. */
  onReply?: (target: ReplyTarget) => void;
}

export function CommentRow({ comment, isReply = false, onReply }: CommentRowProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const toggleLike = useToggleCommentLike();

  const [repliesOpen, setRepliesOpen] = useState(false);
  const prevReplyCount = useRef(comment.replyCount);
  const {
    expanded,
    setExpanded,
    canExpand,
    measured,
    textRef,
    handleNativeLayout,
    isWeb,
    numberOfLines,
  } = useTextTruncation(comment.text, MAX_TEXT_LINES);

  const repliesQuery = useReplies(comment.id);
  const replies = repliesQuery.data?.pages.flatMap((page) => page.replies) ?? [];

  // Auto-reveal replies once a new one lands, regardless of which composer sent it.
  useEffect(() => {
    if (comment.replyCount > prevReplyCount.current) {
      setRepliesOpen(true);
    }
    prevReplyCount.current = comment.replyCount;
  }, [comment.replyCount]);

  function goToProfile() {
    router.push({
      pathname: '/(app)/profile/[username]',
      params: { username: comment.author.username },
    });
  }

  return (
    <View style={[styles.row, isReply && styles.rowNested]}>
      <Pressable onPress={goToProfile} hitSlop={4} accessibilityRole="button" accessibilityLabel={`View @${comment.author.username}'s profile`}>
        <Avatar username={comment.author.username} size={isReply ? 26 : 30} />
      </Pressable>
      <View style={styles.body}>
        <GlassSurface style={styles.bubble} radius={radius.lg}>
          <Pressable onPress={goToProfile} accessibilityRole="button" accessibilityLabel={`View @${comment.author.username}'s profile`}>
            <Text style={styles.author}>@{comment.author.username}</Text>
          </Pressable>
          {/* Native only: rendered once, invisibly, to measure the comment's true line count. */}
          {!isWeb && !measured ? (
            <MentionText
              text={comment.text}
              style={[styles.text, styles.measureText]}
              onTextLayout={handleNativeLayout}
            />
          ) : null}
          <MentionText ref={textRef} text={comment.text} style={styles.text} numberOfLines={numberOfLines} />
        </GlassSurface>
        {canExpand ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          >
            <Text style={styles.seeMore}>{expanded ? 'See less' : 'See more'}</Text>
          </Pressable>
        ) : null}

        <View style={styles.actionsRow}>
          <Text style={styles.time}>{relativeTime(comment.createdAt)}</Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => toggleLike.mutate(comment.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={comment.likedByMe ? 'Unlike comment' : 'Like comment'}
          >
            <Ionicons
              name={comment.likedByMe ? 'heart' : 'heart-outline'}
              size={13}
              color={comment.likedByMe ? colors.like : colors.textMuted}
            />
            <Text style={[styles.actionText, comment.likedByMe && styles.actionTextActive]}>
              {comment.likeCount > 0 ? comment.likeCount : 'Like'}
            </Text>
          </Pressable>
          {!isReply ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => onReply?.({ commentId: comment.id, username: comment.author.username })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Reply"
            >
              <Text style={styles.actionText}>Reply</Text>
            </Pressable>
          ) : null}
        </View>

        {!isReply && comment.replyCount > 0 ? (
          <Pressable
            style={styles.viewReplies}
            onPress={() => setRepliesOpen((open) => !open)}
            accessibilityRole="button"
          >
            <Text style={styles.viewRepliesText}>
              {repliesOpen
                ? 'Hide replies'
                : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
            </Text>
          </Pressable>
        ) : null}

        {!isReply && repliesOpen ? (
          repliesQuery.isLoading ? (
            <ActivityIndicator style={styles.spinner} color={colors.primary} />
          ) : (
            replies.map((reply) => (
              <CommentRow key={reply.id} comment={reply} isReply />
            ))
          )
        ) : null}

      </View>
    </View>
  );
}
