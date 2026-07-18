import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useNotifications } from '../../../src/api/hooks';
import { GlassSurface } from '../../../src/components/GlassSurface';
import { useTheme } from '../../../src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { data } = useNotifications();
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

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
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarBackground: () => <GlassSurface style={StyleSheet.absoluteFill} radius={0} />,
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
