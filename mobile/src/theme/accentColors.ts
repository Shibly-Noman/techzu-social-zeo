export type AccentId = 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';

export interface AccentDef {
  id: AccentId;
  label: string;
  /** Main brand color — used as-is in light mode, and as the dark-mode primary too. */
  primary: string;
  /** Pressed/hover-weight shade of primary. */
  primaryDark: string;
  /** Pale tint of primary used for soft backgrounds in light mode. */
  primarySoftLight: string;
}

export const ACCENTS: AccentDef[] = [
  { id: 'blue', label: 'Blue', primary: '#3B82F6', primaryDark: '#2563EB', primarySoftLight: '#EFF6FF' },
  { id: 'violet', label: 'Violet', primary: '#8B5CF6', primaryDark: '#7C3AED', primarySoftLight: '#F5F3FF' },
  { id: 'emerald', label: 'Emerald', primary: '#10B981', primaryDark: '#059669', primarySoftLight: '#ECFDF5' },
  { id: 'rose', label: 'Rose', primary: '#F43F5E', primaryDark: '#E11D48', primarySoftLight: '#FFF1F2' },
  { id: 'amber', label: 'Amber', primary: '#F59E0B', primaryDark: '#D97706', primarySoftLight: '#FFFBEB' },
  { id: 'cyan', label: 'Cyan', primary: '#06B6D4', primaryDark: '#0891B2', primarySoftLight: '#ECFEFF' },
];

export const DEFAULT_ACCENT_ID: AccentId = 'blue';

export function accentById(id: AccentId): AccentDef {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

/** `#RRGGBB` (or `#RGB`) -> `rgba(r, g, b, alpha)`. */
export function hexToRgba(hex: string, alpha: number): string {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map((c) => c + c).join('');
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
