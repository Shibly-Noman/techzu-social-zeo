import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    inputWithToggle: {
      paddingRight: 48,
    },
    inputError: {
      borderColor: colors.danger,
    },
    toggle: {
      position: 'absolute',
      right: spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    error: {
      marginTop: spacing.xs,
      color: colors.danger,
      fontSize: 13,
    },
  });
}

export function Field({ label, error, style, secureTextEntry, ...inputProps }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && hidden}
          style={[
            styles.input,
            isPassword && styles.inputWithToggle,
            error ? styles.inputError : null,
            style,
          ]}
          {...inputProps}
        />
        {isPassword && (
          <Pressable
            style={styles.toggle}
            onPress={() => setHidden((h) => !h)}
            android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
