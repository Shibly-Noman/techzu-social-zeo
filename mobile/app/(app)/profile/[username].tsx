import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useToggleLike, useUserPosts, useUserProfile } from '../../../src/api/hooks';
import { useAuth } from '../../../src/auth/AuthContext';
import { Avatar } from '../../../src/components/Avatar';
import { GlassSurface } from '../../../src/components/GlassSurface';
import { PostCard } from '../../../src/components/PostCard';
import { PostComposer } from '../../../src/components/PostComposer';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { EmptyState, ErrorView, LoadingView } from '../../../src/components/StatusViews';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../../../src/theme';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
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
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      flexGrow: 1,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileMeta: {
      flex: 1,
      minWidth: 0,
    },
    username: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    joined: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    postCount: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      fontWeight: '600',
    },
    footerSpinner: {
      marginVertical: spacing.lg,
    },
  });
}

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const profileQuery = useUserProfile(username);
  const postsQuery = useUserPosts(username);
  const toggleLike = useToggleLike();

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [postsQuery.data]
  );
  const isOwnProfile = user?.username === profileQuery.data?.username;

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
          <Text style={styles.headerTitle}>Profile</Text>
        </GlassSurface>

        {profileQuery.isLoading ? (
          <LoadingView />
        ) : profileQuery.isError ? (
          <ErrorView
            message={apiErrorMessage(profileQuery.error)}
            onRetry={() => profileQuery.refetch()}
          />
        ) : profileQuery.data ? (
          <>
            <View style={styles.profileCard}>
              <Avatar username={profileQuery.data.username} size={56} />
              <View style={styles.profileMeta}>
                <Text style={styles.username} numberOfLines={1}>
                  @{profileQuery.data.username}
                </Text>
                <Text style={styles.joined}>
                  Joined{' '}
                  {new Date(profileQuery.data.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.postCount}>
                  {profileQuery.data.postCount}{' '}
                  {profileQuery.data.postCount === 1 ? 'post' : 'posts'}
                </Text>
              </View>
            </View>

            {isOwnProfile ? <PostComposer /> : null}

            <FlatList
              data={posts}
              keyExtractor={(post) => post.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <PostCard
                  post={item}
                  onToggleLike={(id) => toggleLike.mutate(id)}
                  onPressAuthor={(name) =>
                    router.push({ pathname: '/(app)/profile/[username]', params: { username: name } })
                  }
                  commentsInline
                />
              )}
              onEndReached={() => {
                if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
                  void postsQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                postsQuery.isLoading ? (
                  <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
                ) : (
                  <EmptyState icon="newspaper-outline" title="No posts yet" />
                )
              }
              ListFooterComponent={
                postsQuery.isFetchingNextPage ? (
                  <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
                ) : null
              }
            />
          </>
        ) : null}
      </ScreenContainer>
    </SafeAreaView>
  );
}
