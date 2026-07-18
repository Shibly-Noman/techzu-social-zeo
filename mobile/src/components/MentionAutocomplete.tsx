import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import type { UserSummary } from '../api/types';
import { radius, spacing, useThemedStyles, type Colors } from '../theme';
import { Avatar } from './Avatar';
import { GlassSurface } from './GlassSurface';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.xs,
      maxHeight: 180,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });
}

/** Dropdown of matching usernames shown while composing an @mention. */
export function MentionAutocomplete({
  users,
  onSelect,
}: {
  users: UserSummary[];
  onSelect: (username: string) => void;
}) {
  const styles = useThemedStyles(createStyles);

  if (users.length === 0) return null;

  return (
    <GlassSurface style={styles.wrap} radius={radius.md}>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => onSelect(item.username)}
            accessibilityRole="button"
            accessibilityLabel={`Mention @${item.username}`}
          >
            <Avatar username={item.username} size={26} />
            <Text style={styles.username}>@{item.username}</Text>
          </Pressable>
        )}
      />
    </GlassSurface>
  );
}
