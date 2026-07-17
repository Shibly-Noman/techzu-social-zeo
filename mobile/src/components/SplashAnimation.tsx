import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const splashAnimation = require('../../assets/splash.json');

// Intentionally NOT theme-reactive: this must exactly match app.json's static
// native splash-screen backgroundColor so the native -> JS handoff has no
// visible color snap, regardless of the user's selected theme/accent.
const SPLASH_BACKGROUND = '#3B82F6';

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
    backgroundColor: SPLASH_BACKGROUND,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
