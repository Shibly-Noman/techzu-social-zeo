import { useMemo } from 'react';
import { useTheme, type Colors } from './ThemeContext';

/**
 * Recomputes a themed StyleSheet whenever the active theme changes.
 * `factory` should itself call `StyleSheet.create({...})` (same shape as a
 * plain static stylesheet, just parameterized by `colors`) rather than
 * returning a bare object for this hook to wrap — passing the literal object
 * directly to `StyleSheet.create` inside `factory` is what lets TypeScript
 * narrow style properties like `flexDirection: 'row'` correctly; wrapping it
 * here instead would widen them to `string` and break the types.
 * `factory` should also be a stable, module-scope function (not an inline
 * arrow) so the memo doesn't rebuild the sheet on every render.
 */
export function useThemedStyles<T>(factory: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
