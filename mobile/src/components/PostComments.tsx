import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiErrorMessage } from '../api/client';
import { useAddComment, useComments } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { applyMention, useMentionSuggestions } from '../hooks/useMentionSuggestions';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';
import { Avatar } from './Avatar';
import { CommentRow, type ReplyTarget } from './CommentRow';
import { GlassSurface } from './GlassSurface';
import { MentionAutocomplete } from './MentionAutocomplete';

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
    replyingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    replyingText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    replyingUsername: {
      fontWeight: '700',
      color: colors.text,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
      borderWidth: 0,
      outlineWidth: 0,
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

/** Inline, non-navigating comment thread — expands in place under a post. */
export function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const commentsQuery = useComments(postId);
  const addComment = useAddComment(postId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  const mention = useMentionSuggestions(text);
  const comments = commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];

  function handleReply(target: ReplyTarget) {
    setError(null);
    setReplyTarget(target);
    setText(user?.username === target.username ? '' : `@${target.username} `);
  }

  function cancelReply() {
    setReplyTarget(null);
    setText('');
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || addComment.isPending) return;
    setError(null);
    try {
      await addComment.mutateAsync({ text: trimmed, parentCommentId: replyTarget?.commentId });
      setText('');
      setReplyTarget(null);
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
        comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} onReply={handleReply} />
        ))
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

      {replyTarget ? (
        <View style={styles.replyingRow}>
          <Text style={styles.replyingText}>
            Replying to <Text style={styles.replyingUsername}>@{replyTarget.username}</Text>
          </Text>
          <Pressable onPress={cancelReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel reply">
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.composerRow}>
        <Avatar username={user?.username ?? ''} size={30} />
        <GlassSurface style={styles.inputWrap} radius={radius.full}>
          <TextInput
            style={styles.composerInput}
            value={text}
            onChangeText={setText}
            placeholder={replyTarget ? `Reply to @${replyTarget.username}…` : 'Write a comment…'}
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
      {mention.active ? (
        <MentionAutocomplete
          users={mention.suggestions}
          onSelect={(username) => setText((t) => applyMention(t, username))}
        />
      ) : null}
    </View>
  );
}
