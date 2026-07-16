import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useFeed, useToggleLike } from '../../../src/api/hooks';
import { useAuth } from '../../../src/auth/AuthContext';
import { PostCard } from '../../../src/components/PostCard';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { EmptyState, ErrorView, LoadingView } from '../../../src/components/StatusViews';
import { colors, radius, spacing } from '../../../src/theme';

export default function FeedScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 400);
    return () => clearTimeout(handle);
  }, [search]);

  const feed = useFeed(debouncedSearch);
  const toggleLike = useToggleLike();

  const posts = useMemo(
    () => feed.data?.pages.flatMap((page) => page.posts) ?? [],
    [feed.data]
  );

  function confirmLogout() {
    if (Platform.OS === 'web') {
      void logout();
      return;
    }
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feed</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerUser}>@{user?.username}</Text>
            <Pressable
              onPress={confirmLogout}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Filter by username…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear filter">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {feed.isLoading ? (
          <LoadingView />
        ) : feed.isError ? (
          <ErrorView message={apiErrorMessage(feed.error)} onRetry={() => feed.refetch()} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(post) => post.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onToggleLike={(id) => toggleLike.mutate(id)}
                onOpenComments={(id) => router.push(`/(app)/post/${id}`)}
                onPressAuthor={(username) => setSearch(username)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={feed.isRefetching && !feed.isFetchingNextPage}
                onRefresh={() => feed.refetch()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReached={() => {
              if (feed.hasNextPage && !feed.isFetchingNextPage) {
                void feed.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <EmptyState
                icon={debouncedSearch ? 'search-outline' : 'newspaper-outline'}
                title={debouncedSearch ? `No posts by "${debouncedSearch}…"` : 'No posts yet'}
                subtitle={
                  debouncedSearch
                    ? 'Try a different username.'
                    : 'Be the first — tap Post to share something!'
                }
              />
            }
            ListFooterComponent={
              feed.isFetchingNextPage ? (
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  footerSpinner: {
    marginVertical: spacing.lg,
  },
});
