import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiErrorMessage } from '../../../src/api/client';
import { useCreatePost } from '../../../src/api/hooks';
import { Button } from '../../../src/components/Button';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { useToast } from '../../../src/components/Toast';
import { colors, radius, spacing } from '../../../src/theme';

const MAX_LENGTH = 500;

export default function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const remaining = MAX_LENGTH - text.length;

  async function handlePublish() {
    if (!trimmed || createPost.isPending) return;
    setError(null);
    try {
      await createPost.mutateAsync(trimmed);
      setText('');
      toast.show('Post published!');
      router.push('/(app)/(tabs)');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New post</Text>
          </View>

          <View style={styles.body}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(value) => setText(value.slice(0, MAX_LENGTH))}
              placeholder="What's happening?"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={MAX_LENGTH}
              accessibilityLabel="Post text"
            />

            <View style={styles.footerRow}>
              <Text style={[styles.counter, remaining <= 20 && styles.counterLow]}>
                {remaining}
              </Text>
              <Button
                title="Publish"
                onPress={handlePublish}
                loading={createPost.isPending}
                disabled={trimmed.length === 0}
                style={styles.publish}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  input: {
    minHeight: 160,
    maxHeight: 320,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  counterLow: {
    color: colors.danger,
  },
  publish: {
    minWidth: 140,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
});
