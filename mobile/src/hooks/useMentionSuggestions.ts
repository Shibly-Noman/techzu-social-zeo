import { useMemo } from 'react';
import { useSearchUsers } from '../api/hooks';
import { useDebouncedValue } from './useDebouncedValue';

// Matches an in-progress "@token" at the very end of the text — the
// composer only offers suggestions for a mention you're currently typing,
// not one you've already finished and moved past. Requires the "@" to
// start the string or follow a non-word character, and at least 1 char
// typed after it (an empty query isn't sent to the search endpoint).
const TRAILING_MENTION = /(?:^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{1,20})$/;

/** Detects an in-progress @mention at the end of `text` and looks up matching usernames. */
export function useMentionSuggestions(text: string) {
  const query = useMemo(() => text.match(TRAILING_MENTION)?.[1] ?? '', [text]);
  // The dropdown itself opens/positions immediately on the raw query so it
  // doesn't lag behind typing; only the network request is debounced.
  const debouncedQuery = useDebouncedValue(query, 300);
  const usersQuery = useSearchUsers(debouncedQuery);

  return {
    active: query.length > 0,
    suggestions: usersQuery.data ?? [],
  };
}

/** Replaces the in-progress trailing "@token" with the full "@username " (space included). */
export function applyMention(text: string, username: string): string {
  const at = text.lastIndexOf('@');
  if (at === -1) return text;
  return `${text.slice(0, at)}@${username} `;
}
