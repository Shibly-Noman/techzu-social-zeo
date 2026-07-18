import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { avatarPalette, useThemedStyles, type Colors } from '../theme';

interface Props {
  username: string;
  size?: number;
}

function colorFor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) | 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

/** Deterministic per-username illustrated avatar (DiceBear "adventurer" style, transparent PNG). */
function avatarUrl(username: string, size: number): string {
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(username)}&size=${Math.round(size * 2)}`;
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    circle: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    initial: {
      color: colors.white,
      fontWeight: '700',
    },
    image: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
}

export function Avatar({ username, size = 40 }: Props) {
  const styles = useThemedStyles(createStyles);
  // The colored-initial circle renders first and stays as the fallback if the
  // DiceBear image fails to load (offline, service down) or hasn't yet.
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorFor(username),
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>
        {username.charAt(0).toUpperCase()}
      </Text>
      {!imageFailed ? (
        <Image
          source={{ uri: avatarUrl(username, size) }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </View>
  );
}
