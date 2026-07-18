import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../../src/theme';

function useEntrance(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
      },
    ],
  };
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    blobTop: {
      position: 'absolute',
      top: -80,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      opacity: 0.08,
    },
    blobBottom: {
      position: 'absolute',
      bottom: -60,
      left: -80,
      width: 260,
      height: 260,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      opacity: 0.06,
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textMuted,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      marginTop: spacing.xxl,
      gap: spacing.md,
    },
    signupButton: {
      marginTop: 0,
    },
  });
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const logoStyle = useEntrance(0);
  const textStyle = useEntrance(120);
  const actionsStyle = useEntrance(240);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenContainer>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />

        <View style={styles.content}>
          <Animated.View style={[styles.logo, logoStyle]}>
            <Ionicons name="chatbubbles" size={40} color={colors.white} />
          </Animated.View>

          <Animated.View style={textStyle}>
            <Text style={styles.title}>Techzu Social Zeo</Text>
            <Text style={styles.subtitle}>Share moments. Connect instantly.</Text>
          </Animated.View>

          <Animated.View style={[styles.actions, actionsStyle]}>
            <Button title="Log in" onPress={() => router.push('/(auth)/login')} />
            <Button
              title="Create account"
              variant="ghost"
              onPress={() => router.push('/(auth)/signup')}
              style={styles.signupButton}
            />
          </Animated.View>
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}
