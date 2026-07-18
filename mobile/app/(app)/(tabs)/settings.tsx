import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GlassSurface } from '../../../src/components/GlassSurface';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ACCENTS,
  radius,
  spacing,
  useTabBarBottomPadding,
  useTheme,
  useThemedStyles,
  type Colors,
  type ThemeMode,
} from '../../../src/theme';

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    scroll: {
      padding: spacing.xl,
      paddingTop: spacing.md,
      gap: spacing.lg,
    },
    section: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modeOption: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    modeLabelActive: {
      color: colors.white,
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchLabelWrap: {
      flex: 1,
      marginRight: spacing.md,
    },
    switchLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    switchHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 1,
    },
  });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <GlassSurface style={styles.section} radius={radius.lg}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </GlassSurface>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode, accentId, setAccentId, glassEnabled, setGlassEnabled } =
    useTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarPadding = useTabBarBottomPadding();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <GlassSurface style={styles.header} radius={0}>
          <Pressable
            onPress={() => router.replace('/(app)/(tabs)')}
            hitSlop={8}
            android_ripple={{ color: colors.ripple, borderless: true, radius: 22 }}
            accessibilityRole="button"
            accessibilityLabel="Go back to feed"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
        </GlassSurface>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}>
          <SectionCard title="Appearance">
            <View style={styles.modeRow}>
              {MODE_OPTIONS.map((option) => {
                const active = mode === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setMode(option.id)}
                    style={[styles.modeOption, active && styles.modeOptionActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} theme`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={active ? colors.white : colors.textMuted}
                    />
                    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard title="Accent color">
            <View style={styles.swatchRow}>
              {ACCENTS.map((accent) => {
                const active = accentId === accent.id;
                return (
                  <Pressable
                    key={accent.id}
                    onPress={() => setAccentId(accent.id)}
                    style={[styles.swatch, { backgroundColor: accent.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${accent.label} accent`}
                  >
                    {active ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard title="Effects">
            <View style={styles.switchRow}>
              <View style={styles.switchLabelWrap}>
                <Text style={styles.switchLabel}>Liquid glass effect</Text>
                <Text style={styles.switchHint}>
                  Frosted, translucent panels throughout the app
                </Text>
              </View>
              <Switch
                value={glassEnabled}
                onValueChange={setGlassEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </SectionCard>
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}
