import { Ionicons } from '@expo/vector-icons';
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
import { GlassSurface } from '../../../src/components/GlassSurface';
import { PostCard } from '../../../src/components/PostCard';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { SkeletonFeed } from '../../../src/components/SkeletonPostCard';
import { EmptyState, ErrorView } from '../../../src/components/StatusViews';
import {
  radius,
  spacing,
  useTabBarBottomPadding,
  useTheme,
  useThemedStyles,
  type Colors,
} from '../../../src/theme';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      flexShrink: 0,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flexShrink: 1,
      minWidth: 0,
      marginLeft: spacing.md,
    },
    headerUser: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      flexShrink: 1,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      marginHorizontal: spacing.xl,
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
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      flexGrow: 1,
    },
    footerSpinner: {
      marginVertical: spacing.lg,
    },
  });
}

export default function FeedScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarPadding = useTabBarBottomPadding();
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
        <GlassSurface style={styles.header} radius={0}>
          <Text style={styles.headerTitle}>Feed</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerUser} numberOfLines={1}>
              @{user?.username}
            </Text>
            <Pressable
              onPress={confirmLogout}
              hitSlop={8}
              android_ripple={{ color: colors.ripple, borderless: true, radius: 24 }}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
        </GlassSurface>

        <GlassSurface style={styles.searchBox} radius={radius.md}>
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
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              android_ripple={{ color: colors.ripple, borderless: true, radius: 18 }}
              accessibilityLabel="Clear filter"
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </GlassSurface>

        {feed.isLoading ? (
          <SkeletonFeed />
        ) : feed.isError ? (
          <ErrorView message={apiErrorMessage(feed.error)} onRetry={() => feed.refetch()} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(post) => post.id}
            contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onToggleLike={(id) => toggleLike.mutate(id)}
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
