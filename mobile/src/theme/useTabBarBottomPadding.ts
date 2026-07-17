import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from './palettes';

/**
 * How much bottom padding a scrollable tab screen needs so its last item
 * clears the floating tab bar. The tab bar is `position: 'absolute'` (see
 * `app/(app)/(tabs)/_layout.tsx`), so screens must reserve this space
 * themselves — nothing does it for them.
 *
 * We can't read the tab bar's actual rendered height here: expo-router
 * vendors its own internal copy of React Navigation's bottom-tabs rather
 * than re-exporting the public package, so `useBottomTabBarHeight()` isn't
 * safely available outside of it. `TAB_BAR_HEIGHT` is a fixed estimate of
 * its content height instead; the safe-area inset is measured for real.
 */
export function useTabBarBottomPadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + extra;
}
