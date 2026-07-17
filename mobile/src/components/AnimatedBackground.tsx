import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { hexToRgba, useTheme } from '../theme';

const useNative = Platform.OS !== 'web';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function useReduceMotionFlag() {
  return useTheme().reduceMotion;
}

/** Loops a 0->1->0 value; freezes at a static resting value when reduceMotion is on. */
function useLoop(duration: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotionFlag();

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, delay, useNativeDriver: useNative }),
        Animated.timing(value, { toValue: 0, duration, useNativeDriver: useNative }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, delay, reduceMotion]);

  return value;
}

// ── Aurora: drifting soft gradient blobs ───────────────────────────────

function AuroraBlob({
  size,
  top,
  left,
  color,
  duration,
  travel,
}: {
  size: number;
  top: number;
  left: number;
  color: string;
  duration: number;
  travel: number;
}) {
  const t = useLoop(duration);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, travel * 0.6] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <LinearGradient
        colors={[hexToRgba(color, 0.38), hexToRgba(color, 0)]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

function AuroraBackground() {
  const { colors } = useTheme();
  return (
    <>
      <AuroraBlob
        size={340}
        top={-80}
        left={-60}
        color={colors.primary}
        duration={9000}
        travel={60}
      />
      <AuroraBlob
        size={300}
        top={SCREEN_H * 0.35}
        left={SCREEN_W - 220}
        color={colors.primaryDark}
        duration={11000}
        travel={-70}
      />
      <AuroraBlob
        size={380}
        top={SCREEN_H - 260}
        left={-100}
        color={colors.primary}
        duration={13000}
        travel={50}
      />
    </>
  );
}

// ── Particles: floating dots ────────────────────────────────────────────

function Particle({
  startX,
  startY,
  size,
  color,
  duration,
  delay,
}: {
  startX: number;
  startY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}) {
  const t = useLoop(duration, delay);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.5, 0.5, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: startY,
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

function ParticlesBackground() {
  const { colors } = useTheme();
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        startX: Math.random() * SCREEN_W,
        startY: SCREEN_H * 0.3 + Math.random() * SCREEN_H * 0.7,
        size: 3 + Math.random() * 5,
        duration: 4000 + Math.random() * 4000,
        delay: Math.random() * 3000,
      })),
    []
  );

  return (
    <>
      {particles.map((p) => (
        <Particle
          key={p.id}
          startX={p.startX}
          startY={p.startY}
          size={p.size}
          color={colors.primary}
          duration={p.duration}
          delay={p.delay}
        />
      ))}
    </>
  );
}

// ── Waves: flowing gradient bands ───────────────────────────────────────

function WaveBand({
  bottom,
  color,
  duration,
  travel,
  height,
}: {
  bottom: number;
  color: string;
  duration: number;
  travel: number;
  height: number;
}) {
  const t = useLoop(duration);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-travel, travel] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom,
        left: -SCREEN_W * 0.3,
        width: SCREEN_W * 1.6,
        height,
        borderRadius: height / 2,
        overflow: 'hidden',
        transform: [{ translateX }],
      }}
    >
      <LinearGradient
        colors={[hexToRgba(color, 0), hexToRgba(color, 0.28), hexToRgba(color, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
}

function WavesBackground() {
  const { colors } = useTheme();
  return (
    <>
      <WaveBand bottom={-40} color={colors.primary} duration={10000} travel={50} height={160} />
      <WaveBand bottom={90} color={colors.primaryDark} duration={13000} travel={70} height={120} />
      <WaveBand bottom={220} color={colors.primary} duration={16000} travel={40} height={90} />
    </>
  );
}

// ── Fireflies: glowing dots connected by faint proximity lines ─────────

const FIREFLY_COUNT = 20;
const CONNECT_DISTANCE = 140;

function Firefly({
  x,
  y,
  size,
  color,
  duration,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}) {
  const t = useLoop(duration, delay);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: size * 2,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

function FirefliesBackground() {
  const { colors } = useTheme();

  // Fixed positions computed once — lines stay accurate without per-frame
  // recomputation, only each dot's glow/opacity animates.
  const { points, lines } = useMemo(() => {
    const pts = Array.from({ length: FIREFLY_COUNT }, () => ({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      size: 3 + Math.random() * 4,
      duration: 1800 + Math.random() * 2200,
      delay: Math.random() * 3000,
    }));

    const segments: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DISTANCE) {
          segments.push({
            x1: pts[i].x + pts[i].size / 2,
            y1: pts[i].y + pts[i].size / 2,
            x2: pts[j].x + pts[j].size / 2,
            y2: pts[j].y + pts[j].size / 2,
            opacity: 1 - dist / CONNECT_DISTANCE,
          });
        }
      }
    }
    return { points: pts, lines: segments };
  }, []);

  return (
    <>
      <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
        {lines.map((line, i) => (
          <Line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={hexToRgba(colors.primary, line.opacity * 0.35)}
            strokeWidth={1}
          />
        ))}
      </Svg>
      {points.map((p, i) => (
        <Firefly
          key={i}
          x={p.x}
          y={p.y}
          size={p.size}
          color={colors.primary}
          duration={p.duration}
          delay={p.delay}
        />
      ))}
    </>
  );
}

/**
 * Full-screen animated backdrop, mounted once behind the app's navigation
 * stack. Screens render a transparent background (via ScreenContainer) when
 * a non-"solid" style is active, so this shows through underneath them.
 */
export function AnimatedBackground() {
  const { backgroundStyle, colors } = useTheme();

  if (backgroundStyle === 'solid') return null;

  return (
    <Animated.View
      style={[styles.container, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
      pointerEvents="none"
    >
      {backgroundStyle === 'aurora' ? <AuroraBackground /> : null}
      {backgroundStyle === 'particles' ? <ParticlesBackground /> : null}
      {backgroundStyle === 'waves' ? <WavesBackground /> : null}
      {backgroundStyle === 'fireflies' ? <FirefliesBackground /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
