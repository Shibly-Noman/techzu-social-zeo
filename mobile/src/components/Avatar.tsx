import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarPalette, colors } from '../theme';

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

export function Avatar({ username, size = 40 }: Props) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontWeight: '700',
  },
});
