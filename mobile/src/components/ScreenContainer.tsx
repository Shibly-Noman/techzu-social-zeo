import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MAX_CONTENT_WIDTH, useTheme, useThemedStyles, type Colors } from '../theme';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      alignItems: 'center',
      // Clips any decorative element positioned outside its normal bounds
      // (e.g. off-canvas blobs) so it can't cause page-level horizontal
      // scroll/overflow on web.
      overflow: 'hidden',
    },
    inner: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
    },
    solidBackground: {
      backgroundColor: colors.background,
    },
  });
}

/**
 * Constrains content to a readable column on tablets/wide screens
 * while filling the width on phones. Owns the screen's background color:
 * flat `colors.background` when the animated backdrop is off ("solid"),
 * transparent otherwise so the animated background shows through.
 */
export function ScreenContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { backgroundStyle } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.outer, backgroundStyle === 'solid' && styles.solidBackground]}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}
