import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useFeed, useToggleLike } from '../../../src/api/hooks';
import { useAuth } from '../../../src/auth/AuthContext';
import { GlassSurface } from '../../../src/components/GlassSurface';
import { PostCard } from '../../../src/components/PostCard';
import { PostComposer } from '../../../src/components/PostComposer';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { SkeletonFeed } from '../../../src/components/SkeletonPostCard';
import { EmptyState, ErrorView } from '../../../src/components/StatusViews';
import { useDebouncedValue } from '../../../src/hooks/useDebouncedValue';
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
    userTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
      minWidth: 0,
    },
    searchInline: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    searchInlineInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      padding: 0,
      borderWidth: 0,
      outlineWidth: 0,
    },
    menuBackdrop: {
      flex: 1,
    },
    menuWrap: {
      position: 'absolute',
      right: spacing.xl,
      minWidth: 190,
    },
    menu: {
      paddingVertical: spacing.xs,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    menuItemText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    menuItemDanger: {
      color: colors.danger,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sm,
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

const HEADER_HEIGHT = 64;

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarPadding = useTabBarBottomPadding();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 400);

  const feed = useFeed(debouncedSearch);
  const toggleLike = useToggleLike();

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      setSearch('');
    } else {
      setMenuOpen(false);
      setSearchOpen(true);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }

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
          {searchOpen ? (
            <View style={styles.searchInline}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInlineInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search username…"
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
            </View>
          ) : (
            <Text style={styles.headerTitle}>Feed</Text>
          )}

          <View style={styles.headerRight}>
            <Pressable
              onPress={toggleSearch}
              hitSlop={8}
              android_ripple={{ color: colors.ripple, borderless: true, radius: 24 }}
              accessibilityRole="button"
              accessibilityLabel={searchOpen ? 'Close search' : 'Search by username'}
            >
              <Ionicons
                name={searchOpen ? 'close' : 'search'}
                size={22}
                color={searchOpen ? colors.primary : colors.textMuted}
              />
            </Pressable>

            {!searchOpen ? (
              <Pressable
                style={styles.userTrigger}
                onPress={() => setMenuOpen((open) => !open)}
                hitSlop={8}
                android_ripple={{ color: colors.ripple, borderless: true }}
                accessibilityRole="button"
                accessibilityLabel="Account menu"
              >
                <Text style={styles.headerUser} numberOfLines={1}>
                  @{user?.username}
                </Text>
                <Ionicons
                  name={menuOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        </GlassSurface>

        <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
            <View style={[styles.menuWrap, { top: insets.top + HEADER_HEIGHT }]}>
              <GlassSurface style={styles.menu} radius={radius.md}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    if (user?.username) {
                      router.push({
                        pathname: '/(app)/profile/[username]',
                        params: { username: user.username },
                      });
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View profile"
                >
                  <Ionicons name="person-outline" size={18} color={colors.text} />
                  <Text style={styles.menuItemText}>View profile</Text>
                </Pressable>
                <View style={styles.menuDivider} />
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    confirmLogout();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>Log out</Text>
                </Pressable>
              </GlassSurface>
            </View>
          </Pressable>
        </Modal>

        <PostComposer />

        {feed.isLoading ? (
          <SkeletonFeed />
        ) : feed.isError ? (
          <ErrorView message={apiErrorMessage(feed.error)} onRetry={() => feed.refetch()} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(post) => post.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onToggleLike={(id) => toggleLike.mutate(id)}
                onPressAuthor={(username) =>
                  router.push({ pathname: '/(app)/profile/[username]', params: { username } })
                }
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
                    : 'Be the first to share something!'
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
