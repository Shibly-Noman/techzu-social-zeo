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
import { colors, spacing } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  async function handleLogin() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      // Redirect happens via the (auth) layout guard.
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
                <Ionicons name="chatbubbles" size={34} color={colors.white} />
              </View>
              <Text style={styles.title}>Mini Social Feed</Text>
              <Text style={styles.subtitle}>Welcome back — sign in to continue</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field
              label="Username or email"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="alice or alice@example.com"
              textContentType="username"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              textContentType="password"
              onSubmitEditing={handleLogin}
            />

            <Button
              title="Log in"
              onPress={handleLogin}
              loading={submitting}
              disabled={!canSubmit}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here?</Text>
              <Link href="/(auth)/signup" style={styles.footerLink}>
                Create an account
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
