import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { radius, spacing, useThemedStyles, type Colors } from '../theme';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    list: {
      paddingHorizontal: spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.skeleton,
    },
    meta: {
      marginLeft: spacing.md,
    },
    bar: {
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.skeleton,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.xl,
      marginTop: spacing.lg,
    },
  });
}

/** Pulsing placeholder card shown while the feed loads. */
export function SkeletonPostCard() {
  const styles = useThemedStyles(createStyles);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.meta}>
          <View style={[styles.bar, { width: 110 }]} />
          <View style={[styles.bar, { width: 56, marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.bar, { width: '92%', marginTop: spacing.lg }]} />
      <View style={[styles.bar, { width: '70%', marginTop: spacing.sm }]} />
      <View style={styles.actions}>
        <View style={[styles.bar, { width: 44 }]} />
        <View style={[styles.bar, { width: 44 }]} />
      </View>
    </Animated.View>
  );
}

export function SkeletonFeed({ count = 4 }: { count?: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPostCard key={i} />
      ))}
    </View>
  );
}
