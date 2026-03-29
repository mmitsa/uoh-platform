import { I18nManager, Platform } from 'react-native';

export const colors = {
  brand: {
    50: '#eef7f4', 100: '#d9eee6', 200: '#b6dece', 300: '#8bc9b2',
    400: '#56ae90', 500: '#2f8f71', 600: '#24755c', 700: '#1e5f4c',
    800: '#1b4f40', 900: '#174236',
  },
  accent: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12',
  },
  neutral: {
    0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
    300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569',
    700: '#334155', 800: '#1f2937', 900: '#0f172a',
  },
  semantic: {
    success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#2563eb',
  },
} as const;

const darkColors = {
  brand: {
    50: '#142823', 100: '#19372d', 200: '#1e463a', 300: '#32785f',
    400: '#469b7d', 500: '#37a582', 600: '#2f8f71', 700: '#37a582',
    800: '#50be9b', 900: '#8bdcbe',
  },
  accent: {
    50: '#271e0e', 100: '#3d2a10', 200: '#5c3c14', 300: '#7c5120',
    400: '#c87830', 500: '#f97316', 600: '#ea580c', 700: '#fb923c',
    800: '#fdba74', 900: '#ffedd5',
  },
  neutral: {
    0: '#111827', 50: '#0b0f19', 100: '#161e2e', 200: '#263248',
    300: '#37465f', 400: '#7887a0', 500: '#94a3b8', 600: '#b4c0d2',
    700: '#d2dae6', 800: '#e6ecf4', 900: '#f0f5fa',
  },
  semantic: {
    success: '#22c55e', warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
  },
} as const;

const sharedLayout = {
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40,
  },
  radius: {
    xs: 6, sm: 10, md: 14, lg: 18, xl: 24, full: 999,
  },
  fontSize: {
    xs: 11, sm: 13, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30,
  },
  isRTL: I18nManager.isRTL,
} as const;

const lightShadow = Platform.select({
  ios: {
    sm: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
    md: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
    lg: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },
  },
  android: { sm: { elevation: 1 }, md: { elevation: 4 }, lg: { elevation: 8 } },
  default: { sm: { elevation: 1 }, md: { elevation: 4 }, lg: { elevation: 8 } },
})!;

const darkShadow = Platform.select({
  ios: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20 },
  },
  android: { sm: { elevation: 2 }, md: { elevation: 6 }, lg: { elevation: 12 } },
  default: { sm: { elevation: 2 }, md: { elevation: 6 }, lg: { elevation: 12 } },
})!;

export const lightTheme = {
  colors: {
    primary: colors.brand[700],
    primaryLight: colors.brand[100],
    primaryDark: colors.brand[900],
    accent: colors.accent[500],
    accentLight: colors.accent[100],
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textMuted: colors.neutral[400],
    background: colors.neutral[50],
    surface: colors.neutral[0],
    border: colors.neutral[200],
    borderLight: colors.neutral[100],
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    danger: colors.semantic.danger,
    info: colors.semantic.info,
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  shadow: lightShadow,
  ...sharedLayout,
} as const;

export const darkTheme = {
  colors: {
    primary: darkColors.brand[700],
    primaryLight: darkColors.brand[100],
    primaryDark: darkColors.brand[900],
    accent: darkColors.accent[500],
    accentLight: darkColors.accent[100],
    text: darkColors.neutral[900],
    textSecondary: darkColors.neutral[600],
    textMuted: darkColors.neutral[400],
    background: darkColors.neutral[50],
    surface: darkColors.neutral[0],
    border: darkColors.neutral[200],
    borderLight: darkColors.neutral[100],
    success: darkColors.semantic.success,
    warning: darkColors.semantic.warning,
    danger: darkColors.semantic.danger,
    info: darkColors.semantic.info,
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  shadow: darkShadow,
  ...sharedLayout,
} as const;

// Backward compatibility — used by files not yet migrated to useTheme()
export const theme = lightTheme;

export type Theme = typeof lightTheme;
