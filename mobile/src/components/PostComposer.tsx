import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiErrorMessage } from '../api/client';
import { useCreatePost } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { applyMention, useMentionSuggestions } from '../hooks/useMentionSuggestions';
import { radius, spacing, useTheme, useThemedStyles, type Colors } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { GlassSurface } from './GlassSurface';
import { MentionAutocomplete } from './MentionAutocomplete';
import { useToast } from './Toast';

const MAX_LENGTH = 500;

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      padding: spacing.md,
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    triggerPill: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: colors.background,
    },
    triggerText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    inputWrap: {
      flex: 1,
    },
    input: {
      minHeight: 90,
      maxHeight: 240,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderWidth: 0,
      outlineWidth: 0,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    counter: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    counterLow: {
      color: colors.danger,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      minWidth: 84,
    },
    publishButton: {
      minWidth: 100,
    },
    errorBox: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
  });
}

/** Facebook-style inline composer: a collapsed trigger row that expands to a full post editor. */
export function PostComposer() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const createPost = useCreatePost();
  const toast = useToast();

  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mention = useMentionSuggestions(text);

  const trimmed = text.trim();
  const remaining = MAX_LENGTH - text.length;

  function collapse() {
    setExpanded(false);
    setText('');
    setError(null);
  }

  async function handlePublish() {
    if (!trimmed || createPost.isPending) return;
    setError(null);
    try {
      await createPost.mutateAsync(trimmed);
      collapse();
      toast.show('Post published!');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <GlassSurface style={styles.card} radius={radius.lg}>
      <View style={styles.triggerRow}>
        <Avatar username={user?.username ?? ''} size={38} />
        {expanded ? (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(value) => setText(value.slice(0, MAX_LENGTH))}
              placeholder="What's happening?"
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              accessibilityLabel="Post text"
            />
          </View>
        ) : (
          <Pressable
            style={styles.triggerPill}
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Create a post"
          >
            <Text style={styles.triggerText}>What&rsquo;s on your mind, {user?.username}?</Text>
          </Pressable>
        )}
      </View>

      {expanded ? (
        <>
          {mention.active ? (
            <MentionAutocomplete
              users={mention.suggestions}
              onSelect={(username) => setText((t) => applyMention(t, username))}
            />
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Text style={[styles.counter, remaining <= 20 && styles.counterLow]}>{remaining}</Text>
            <View style={styles.actions}>
              <Button title="Cancel" variant="ghost" onPress={collapse} style={styles.cancelButton} />
              <Button
                title="Post"
                onPress={handlePublish}
                loading={createPost.isPending}
                disabled={trimmed.length === 0}
                style={styles.publishButton}
              />
            </View>
          </View>
        </>
      ) : null}
    </GlassSurface>
  );
}
