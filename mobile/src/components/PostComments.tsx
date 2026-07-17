import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiErrorMessage } from '../api/client';
import { useAddComment, useComments } from '../api/hooks';
import type { Comment } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';
import { relativeTime } from '../utils/relativeTime';
import { Avatar } from './Avatar';
import { GlassSurface } from './GlassSurface';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    spinner: {
      marginVertical: spacing.md,
    },
    empty: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    comment: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    commentBody: {
      flex: 1,
      minWidth: 0,
    },
    bubble: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignSelf: 'flex-start',
    },
    commentAuthor: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    commentText: {
      fontSize: 14,
      color: colors.text,
      marginTop: 1,
      lineHeight: 19,
    },
    commentTime: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      marginLeft: spacing.sm,
    },
    moreButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    moreText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      marginBottom: spacing.sm,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    inputWrap: {
      flex: 1,
    },
    composerInput: {
      maxHeight: 90,
      minHeight: 36,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      color: colors.text,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: {
      opacity: 0.5,
    },
  });
}

function CommentRow({ comment }: { comment: Comment }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.comment}>
      <Avatar username={comment.author.username} size={30} />
      <View style={styles.commentBody}>
        <GlassSurface style={styles.bubble} radius={radius.lg}>
          <Text style={styles.commentAuthor}>@{comment.author.username}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </GlassSurface>
        <Text style={styles.commentTime}>{relativeTime(comment.createdAt)}</Text>
      </View>
    </View>
  );
}

/** Inline, non-navigating comment thread — expands in place under a post. */
export function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const commentsQuery = useComments(postId);
  const addComment = useAddComment(postId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const comments = commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || addComment.isPending) return;
    setError(null);
    try {
      await addComment.mutateAsync(trimmed);
      setText('');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <View style={styles.container}>
      {commentsQuery.isLoading ? (
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>No comments yet — be the first to reply.</Text>
      ) : (
        comments.map((comment) => <CommentRow key={comment.id} comment={comment} />)
      )}

      {commentsQuery.hasNextPage ? (
        <Pressable
          onPress={() => commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          style={styles.moreButton}
          accessibilityRole="button"
        >
          {commentsQuery.isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.moreText}>View more comments</Text>
          )}
        </Pressable>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.composerRow}>
        <Avatar username={user?.username ?? ''} size={30} />
        <GlassSurface style={styles.inputWrap} radius={radius.full}>
          <TextInput
            style={styles.composerInput}
            value={text}
            onChangeText={setText}
            placeholder="Write a comment…"
            placeholderTextColor={colors.textMuted}
            maxLength={300}
            multiline
            accessibilityLabel="Comment text"
          />
        </GlassSurface>
        <Pressable
          style={[
            styles.sendButton,
            (!text.trim() || addComment.isPending) && styles.sendDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || addComment.isPending}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
        >
          {addComment.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={15} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
