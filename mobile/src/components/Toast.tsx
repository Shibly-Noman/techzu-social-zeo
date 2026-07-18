import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, useThemedStyles, type Colors } from '../theme';

interface ToastOptions {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 2200;
const useNative = Platform.OS !== 'web';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      bottom: 96,
      alignSelf: 'center',
      backgroundColor: '#1E293B',
      borderRadius: radius.full,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    pressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    text: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}

/** Lightweight success toast rendered above the tab bar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const [toast, setToast] = useState<{ message: string; options: ToastOptions } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, options });
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: useNative }),
        Animated.spring(translateY, { toValue: 0, speed: 20, useNativeDriver: useNative }),
      ]).start();
      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: useNative }),
          Animated.timing(translateY, { toValue: 16, duration: 220, useNativeDriver: useNative }),
        ]).start(() => setToast(null));
      }, VISIBLE_MS);
    },
    [opacity, translateY]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents={toast.options.onPress ? 'box-none' : 'none'}
          style={[styles.toast, { opacity, transform: [{ translateY }] }]}
        >
          <Pressable style={styles.pressable} onPress={toast.options.onPress}>
            <Ionicons
              name={toast.options.icon ?? 'checkmark-circle'}
              size={20}
              color={toast.options.iconColor ?? '#4ADE80'}
            />
            <Text style={styles.text}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
