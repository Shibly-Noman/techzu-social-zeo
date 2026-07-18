import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MAX_CONTENT_WIDTH, useThemedStyles, type Colors } from '../theme';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    inner: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
    },
  });
}

/**
 * Constrains content to a readable column on tablets/wide screens
 * while filling the width on phones.
 */
export function ScreenContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}
