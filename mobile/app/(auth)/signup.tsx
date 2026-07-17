import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { spacing, useTheme, useThemedStyles, type Colors } from '../../src/theme';

function validate(username: string, email: string, password: string) {
  const errors: { username?: string; email?: string; password?: string } = {};
  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    errors.username = '3–20 characters; letters, numbers and _ only';
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (password && password.length < 6) {
    errors.password = 'At least 6 characters';
  }
  return errors;
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    hero: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logo: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    errorBox: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.xl,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    footerLink: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 15,
    },
  });
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldErrors = validate(username, email, password);
  const canSubmit =
    username.length >= 3 &&
    email.length > 3 &&
    password.length >= 6 &&
    Object.keys(fieldErrors).length === 0;

  async function handleSignup() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signup(username.trim().toLowerCase(), email.trim().toLowerCase(), password);
    } catch (err) {
      setError(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenContainer>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <View style={styles.logo}>
                <Ionicons name="person-add" size={30} color={colors.white} />
              </View>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join the feed in a few seconds</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="alice"
              error={fieldErrors.username}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="alice@example.com"
              error={fieldErrors.email}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              error={fieldErrors.password}
              onSubmitEditing={handleSignup}
            />

            <Button
              title="Sign up"
              onPress={handleSignup}
              loading={submitting}
              disabled={!canSubmit}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/(auth)/login" style={styles.footerLink}>
                Log in
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </SafeAreaView>
  );
}
