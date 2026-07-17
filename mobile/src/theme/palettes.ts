/** Colors that don't come from the selected accent — everything except primary/primaryDark/primarySoft/ripple. */
export interface BaseColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  like: string;
  danger: string;
  white: string;
  skeleton: string;
  rippleOnPrimary: string;
}

export const lightBaseColors: BaseColors = {
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  like: '#EF4444',
  danger: '#DC2626',
  white: '#FFFFFF',
  skeleton: '#E2E8F0',
  rippleOnPrimary: 'rgba(255, 255, 255, 0.25)',
};

export const darkBaseColors: BaseColors = {
  background: '#0B1220',
  card: '#151F32',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#243044',
  like: '#F87171',
  danger: '#F87171',
  white: '#FFFFFF',
  skeleton: '#1E293B',
  rippleOnPrimary: 'rgba(255, 255, 255, 0.25)',
};

/** Theme-invariant tokens — unchanged from the old static theme.ts. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

/** Feed/content column is capped so tablets don't stretch cards edge-to-edge. */
export const MAX_CONTENT_WIDTH = 640;

/**
 * Content height of the floating bottom tab bar (excludes the safe-area
 * bottom inset, which the tab bar adds on top of this itself). Used to pad
 * scrollable screens so their last item isn't hidden underneath it — see
 * `useTabBarBottomPadding` in `src/theme/useTabBarBottomPadding.ts`.
 */
export const TAB_BAR_HEIGHT = 56;

export const avatarPalette = [
  '#4F46E5',
  '#0891B2',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#DB2777',
  '#2563EB',
];
