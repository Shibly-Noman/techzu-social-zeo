import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useAddComment, useComments, usePost, useToggleLike } from '../../../src/api/hooks';
import type { Comment } from '../../../src/api/types';
import { Avatar } from '../../../src/components/Avatar';
import { GlassSurface } from '../../../src/components/GlassSurface';
import { PostCard } from '../../../src/components/PostCard';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { EmptyState, ErrorView, LoadingView } from '../../../src/components/StatusViews';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../../../src/theme';
import { relativeTime } from '../../../src/utils/relativeTime';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    list: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
      flexGrow: 1,
    },
    postWrapper: {
      marginBottom: spacing.sm,
    },
    commentsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    comment: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    commentBody: {
      flex: 1,
      minWidth: 0,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
      minWidth: 0,
    },
    commentTime: {
      fontSize: 12,
      color: colors.textMuted,
      flexShrink: 0,
    },
    commentText: {
      fontSize: 15,
      color: colors.text,
      marginTop: 2,
      lineHeight: 21,
    },
    composer: {
      padding: spacing.md,
      paddingHorizontal: spacing.xl,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    inputWrap: {
      flex: 1,
    },
    composerCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    composerCountLow: {
      color: colors.danger,
    },
    composerInput: {
      maxHeight: 110,
      minHeight: 42,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: {
      opacity: 0.5,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xs,
    },
    footerSpinner: {
      marginVertical: spacing.lg,
    },
  });
}

function CommentRow({ comment }: { comment: Comment }) {
  const styles = useThemedStyles(createStyles);
  return (
    <GlassSurface style={styles.comment} radius={radius.md}>
      <Avatar username={comment.author.username} size={34} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor} numberOfLines={1}>
            @{comment.author.username}
          </Text>
          <Text style={styles.commentTime}>{relativeTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </GlassSurface>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const postQuery = usePost(id);
  const commentsQuery = useComments(id);
  const addComment = useAddComment(id);
  const toggleLike = useToggleLike();

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [],
    [commentsQuery.data]
  );

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <GlassSurface style={styles.header} radius={0}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)'))}
            hitSlop={8}
            android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
        </GlassSurface>

        {postQuery.isLoading ? (
          <LoadingView />
        ) : postQuery.isError ? (
          <ErrorView
            message={apiErrorMessage(postQuery.error)}
            onRetry={() => postQuery.refetch()}
          />
        ) : postQuery.data ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <FlatList
              data={comments}
              keyExtractor={(comment) => comment.id}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <View style={styles.postWrapper}>
                  <PostCard
                    post={postQuery.data}
                    onToggleLike={(postId) => toggleLike.mutate(postId)}
                    commentsInline={false}
                  />
                  <Text style={styles.commentsTitle}>
                    Comments ({postQuery.data.commentCount})
                  </Text>
                </View>
              }
              renderItem={({ item }) => <CommentRow comment={item} />}
              onEndReached={() => {
                if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
                  void commentsQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                commentsQuery.isLoading ? (
                  <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
                ) : (
                  <EmptyState
                    icon="chatbubble-ellipses-outline"
                    title="No comments yet"
                    subtitle="Start the conversation below."
                  />
                )
              }
              ListFooterComponent={
                commentsQuery.isFetchingNextPage ? (
                  <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
                ) : null
              }
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <GlassSurface style={styles.composer} radius={0}>
              <View style={styles.composerRow}>
                <GlassSurface style={styles.inputWrap} radius={radius.md}>
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
                  style={[styles.sendButton, (!text.trim() || addComment.isPending) && styles.sendDisabled]}
                  onPress={handleSend}
                  disabled={!text.trim() || addComment.isPending}
                  android_ripple={{ color: colors.rippleOnPrimary, borderless: true, radius: 21 }}
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                >
                  {addComment.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </Pressable>
              </View>
              {text.length > 0 && (
                <Text style={[styles.composerCount, text.length >= 280 && styles.composerCountLow]}>
                  {text.length}/300
                </Text>
              )}
            </GlassSurface>
          </KeyboardAvoidingView>
        ) : null}
      </ScreenContainer>
    </SafeAreaView>
  );
}
