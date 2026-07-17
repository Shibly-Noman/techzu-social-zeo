import { Ionicons } from '@expo/vector-icons';
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
  type BackgroundStyle,
  type Colors,
  type ThemeMode,
} from '../../../src/theme';

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const BACKGROUND_OPTIONS: {
  id: BackgroundStyle;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  { id: 'aurora', label: 'Aurora', icon: 'color-wand-outline', description: 'Drifting gradient blobs' },
  { id: 'particles', label: 'Particles', icon: 'ellipse-outline', description: 'Floating dots' },
  { id: 'waves', label: 'Waves', icon: 'water-outline', description: 'Flowing gradient bands' },
  { id: 'fireflies', label: 'Fireflies', icon: 'sparkles-outline', description: 'Glowing dots, faintly connected' },
  { id: 'solid', label: 'Solid', icon: 'square-outline', description: 'Plain background, no animation' },
];

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    header: {
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
    backgroundOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    backgroundOptionActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    backgroundIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundBody: {
      flex: 1,
    },
    backgroundLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    backgroundDescription: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 1,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
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
  const {
    colors,
    mode,
    setMode,
    accentId,
    setAccentId,
    backgroundStyle,
    setBackgroundStyle,
    reduceMotion,
    setReduceMotion,
    glassEnabled,
    setGlassEnabled,
  } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarPadding = useTabBarBottomPadding();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <GlassSurface style={styles.header} radius={0}>
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

          <SectionCard title="Background">
            {BACKGROUND_OPTIONS.map((option) => {
              const active = backgroundStyle === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setBackgroundStyle(option.id)}
                  style={[styles.backgroundOption, active && styles.backgroundOptionActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} background`}
                >
                  <View style={styles.backgroundIcon}>
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.backgroundBody}>
                    <Text style={styles.backgroundLabel}>{option.label}</Text>
                    <Text style={styles.backgroundDescription}>{option.description}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </SectionCard>

          <SectionCard title="Motion & effects">
            <View style={styles.switchRow}>
              <View style={styles.switchLabelWrap}>
                <Text style={styles.switchLabel}>Reduce motion</Text>
                <Text style={styles.switchHint}>Turns off the background animation</Text>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
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
