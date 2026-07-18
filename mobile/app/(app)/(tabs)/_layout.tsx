import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../../src/api/hooks';
import { useTheme } from '../../../src/theme';

const MIN_OPACITY = 0.22;
const MAX_OPACITY = 0.5;
const PERIOD_MS = 3600;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { data } = useNotifications();
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  // Drives the tab bar's glow shadow. Plain numeric state on an interval,
  // *not* an Animated.Value: react-native-web has to fold shadowColor +
  // shadowOpacity into a single CSS `box-shadow` string, and that conversion
  // needs a real number at the time it runs. An Animated.Value is a special
  // object, not a number, so the conversion silently produces nothing —
  // that's why the shadow disappeared when it was animated that way,
  // regardless of which element it lived on.
  const [glowOpacity, setGlowOpacity] = useState(MIN_OPACITY);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const wave = (Math.sin((elapsed / PERIOD_MS) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      setGlowOpacity(MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * wave);
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // `position: 'absolute'` pins the tab bar to the viewport bottom so it
        // stays put while screen content scrolls underneath it, instead of
        // sitting in normal flow where it could scroll out of view. Height is
        // left to React Navigation's own default (auto-sizes with the
        // safe-area bottom inset) — see `useTabBarBottomPadding` for how
        // screens compensate their own scroll content for the overlap this
        // creates.
        //
        // Solid (not translucent) background with a colored glow shadow cast
        // upward over the scrolled content, instead of a blurred/frosted look.
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -6 },
          shadowRadius: 16,
          shadowOpacity: glowOpacity,
          elevation: 16,
        },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.like, color: colors.white },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
