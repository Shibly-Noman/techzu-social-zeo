import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { hexToRgba, radius as themeRadius, useTheme } from '../theme';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
}

/**
 * "Liquid glass" surface: a static frosted/translucent panel (BlurView +
 * tinted overlay + thin border). Deliberately not animated — animation
 * lives only in the app's background, not on UI chrome like cards/bars.
 * Degrades to a plain flat `colors.card` panel when the user turns the
 * glass effect off.
 */
export function GlassSurface({ children, style, radius = themeRadius.lg, intensity = 40 }: Props) {
  const { colors, resolvedScheme, glassEnabled } = useTheme();

  if (!glassEnabled) {
    return (
      <View style={[styles.base, { borderRadius: radius, backgroundColor: colors.card }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius, borderColor: hexToRgba(colors.border, 0.9) },
        style,
      ]}
    >
      {/*
        Backdrop layers are purely decorative: `pointerEvents="none"` keeps
        them from ever intercepting touches/clicks, and a negative zIndex
        guarantees they paint behind `children` (which stay direct children
        of this box — NOT wrapped in an extra view — so that flexDirection/
        justifyContent/padding passed in via `style` still apply to them
        exactly as if this were a plain View).
      */}
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint={resolvedScheme === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, styles.backLayer]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.backLayer,
          { backgroundColor: hexToRgba(colors.card, resolvedScheme === 'dark' ? 0.45 : 0.55) },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  backLayer: {
    zIndex: -1,
  },
});
