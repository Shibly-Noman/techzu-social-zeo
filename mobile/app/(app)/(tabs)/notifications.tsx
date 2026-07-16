import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useMarkNotificationsRead, useNotifications } from '../../../src/api/hooks';
import type { NotificationItem } from '../../../src/api/types';
import { Avatar } from '../../../src/components/Avatar';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { EmptyState, ErrorView, LoadingView } from '../../../src/components/StatusViews';
import { colors, radius, spacing } from '../../../src/theme';
import { relativeTime } from '../../../src/utils/relativeTime';

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Avatar username={item.actor.username} size={42} />
      <View style={styles.rowBody}>
        <Text style={styles.rowText}>
          <Text style={styles.rowActor}>@{item.actor.username}</Text>
          {item.type === 'like' ? ' liked your post' : ' commented on your post'}
        </Text>
        {item.type === 'comment' && item.commentText ? (
          <Text style={styles.rowQuote} numberOfLines={2}>
            “{item.commentText}”
          </Text>
        ) : null}
        {item.post ? (
          <Text style={styles.rowPost} numberOfLines={1}>
            {item.post.text}
          </Text>
        ) : null}
        <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
      </View>
      <Ionicons
        name={item.type === 'like' ? 'heart' : 'chatbubble'}
        size={18}
        color={item.type === 'like' ? colors.like : colors.primary}
      />
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkNotificationsRead();

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data]
  );
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

  // Clear the badge when the user views this screen.
  useFocusEffect(
    useCallback(() => {
      if (unreadCount > 0 && !markRead.isPending) {
        markRead.mutate();
      }
    }, [unreadCount]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>

        {query.isLoading ? (
          <LoadingView />
        ) : query.isError ? (
          <ErrorView message={apiErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <NotificationRow
                item={item}
                onPress={() => {
                  if (item.post) router.push(`/(app)/post/${item.post.id}`);
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching && !query.isFetchingNextPage}
                onRefresh={() => query.refetch()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                void query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <EmptyState
                icon="notifications-off-outline"
                title="Nothing yet"
                subtitle="Likes and comments on your posts will show up here."
              />
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
              ) : null
            }
          />
        )}
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowUnread: {
    backgroundColor: colors.primarySoft,
    borderColor: '#C7D2FE',
  },
  rowBody: {
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  rowActor: {
    fontWeight: '700',
  },
  rowQuote: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  rowPost: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  footerSpinner: {
    marginVertical: spacing.lg,
  },
});
