import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const splashAnimation = require('../../assets/splash.json');

/** How long the splash animation is given to play before the app fades it out. */
export const SPLASH_DURATION_MS = 3000;

/** Animated splash shown for a fixed duration on launch. */
export function SplashAnimation() {
  return (
    <View style={styles.container}>
      <LottieView
        source={splashAnimation}
        autoPlay
        loop={false}
        // `duration` drives native playback; `speed` is the web fallback (duration is native-only).
        // splash.json's native length is 2s (120 frames @ 60fps); slow it to stretch across 3s.
        duration={SPLASH_DURATION_MS}
        speed={0.667}
        style={styles.animation}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
