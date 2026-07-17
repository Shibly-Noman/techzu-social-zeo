import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS, storage } from '../auth/storage';
import { accentById, ACCENTS, DEFAULT_ACCENT_ID, hexToRgba, type AccentId } from './accentColors';
import { darkBaseColors, lightBaseColors, type BaseColors } from './palettes';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BackgroundStyle = 'aurora' | 'particles' | 'waves' | 'fireflies' | 'solid';

export interface Colors extends BaseColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  ripple: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedScheme: 'light' | 'dark';
  colors: Colors;
  accentId: AccentId;
  backgroundStyle: BackgroundStyle;
  reduceMotion: boolean;
  glassEnabled: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccentId: (id: AccentId) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setReduceMotion: (value: boolean) => void;
  setGlassEnabled: (value: boolean) => void;
}

const DEFAULT_MODE: ThemeMode = 'system';
const DEFAULT_BACKGROUND_STYLE: BackgroundStyle = 'aurora';
const BACKGROUND_STYLES: BackgroundStyle[] = ['aurora', 'particles', 'waves', 'fireflies', 'solid'];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildColors(scheme: 'light' | 'dark', accentId: AccentId): Colors {
  const base = scheme === 'dark' ? darkBaseColors : lightBaseColors;
  const accent = accentById(accentId);
  return {
    ...base,
    primary: accent.primary,
    primaryDark: accent.primaryDark,
    primarySoft: scheme === 'dark' ? hexToRgba(accent.primary, 0.18) : accent.primarySoftLight,
    ripple: hexToRgba(accent.primary, 0.12),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [accentId, setAccentIdState] = useState<AccentId>(DEFAULT_ACCENT_ID);
  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(
    DEFAULT_BACKGROUND_STYLE
  );
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [glassEnabled, setGlassEnabledState] = useState(true);

  // Restore persisted prefs on launch (defaults above apply until this resolves).
  useEffect(() => {
    (async () => {
      const [storedMode, storedAccent, storedBackground, storedReduceMotion, storedGlass] =
        await Promise.all([
          storage.get(STORAGE_KEYS.themeMode),
          storage.get(STORAGE_KEYS.accentId),
          storage.get(STORAGE_KEYS.backgroundStyle),
          storage.get(STORAGE_KEYS.reduceMotion),
          storage.get(STORAGE_KEYS.glassEnabled),
        ]);
      if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
        setModeState(storedMode);
      }
      if (storedAccent && ACCENTS.some((a) => a.id === storedAccent)) {
        setAccentIdState(storedAccent as AccentId);
      }
      if (storedBackground && BACKGROUND_STYLES.includes(storedBackground as BackgroundStyle)) {
        setBackgroundStyleState(storedBackground as BackgroundStyle);
      }
      if (storedReduceMotion != null) setReduceMotionState(storedReduceMotion === 'true');
      if (storedGlass != null) setGlassEnabledState(storedGlass === 'true');
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void storage.set(STORAGE_KEYS.themeMode, next);
  }, []);

  const setAccentId = useCallback((id: AccentId) => {
    setAccentIdState(id);
    void storage.set(STORAGE_KEYS.accentId, id);
  }, []);

  const setBackgroundStyle = useCallback((next: BackgroundStyle) => {
    setBackgroundStyleState(next);
    void storage.set(STORAGE_KEYS.backgroundStyle, next);
  }, []);

  const setReduceMotion = useCallback((value: boolean) => {
    setReduceMotionState(value);
    void storage.set(STORAGE_KEYS.reduceMotion, String(value));
  }, []);

  const setGlassEnabled = useCallback((value: boolean) => {
    setGlassEnabledState(value);
    void storage.set(STORAGE_KEYS.glassEnabled, String(value));
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const colors = useMemo(
    () => buildColors(resolvedScheme, accentId),
    [resolvedScheme, accentId]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedScheme,
      colors,
      accentId,
      backgroundStyle,
      reduceMotion,
      glassEnabled,
      setMode,
      setAccentId,
      setBackgroundStyle,
      setReduceMotion,
      setGlassEnabled,
    }),
    [
      mode,
      resolvedScheme,
      colors,
      accentId,
      backgroundStyle,
      reduceMotion,
      glassEnabled,
      setMode,
      setAccentId,
      setBackgroundStyle,
      setReduceMotion,
      setGlassEnabled,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
