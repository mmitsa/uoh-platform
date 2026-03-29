import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle, type StyleProp } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { theme } from '../../ui/theme';
import type { Theme } from '../../ui/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const variants: Record<Variant, { bg: ViewStyle; txt: TextStyle }> = {
  primary: { bg: { backgroundColor: theme.colors.primary }, txt: { color: '#fff' } },
  secondary: { bg: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary }, txt: { color: theme.colors.primary } },
  danger: { bg: { backgroundColor: theme.colors.danger }, txt: { color: '#fff' } },
  ghost: { bg: { backgroundColor: 'transparent' }, txt: { color: theme.colors.primary } },
};

const sizes: Record<Size, { pad: ViewStyle; font: number }> = {
  sm: { pad: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radius.sm }, font: theme.fontSize.sm },
  md: { pad: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: theme.radius.md }, font: theme.fontSize.base },
  lg: { pad: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: theme.radius.lg }, font: theme.fontSize.lg },
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, icon, children, onPress, style }: ButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const off = disabled || loading;
  const v = variants[variant];
  const s = sizes[size];
  const indicatorColor = variant === 'primary' || variant === 'danger' ? '#fff' : theme.colors.primary;

  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [styles.base, v.bg, s.pad, off && styles.disabled, pressed && !off && styles.pressed, style]} accessibilityRole="button">
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={indicatorColor} style={{ marginEnd: 8 }} />
          : icon ? <View style={{ marginEnd: 8 }}>{icon}</View> : null}
        <Text style={[styles.text, v.txt, { fontSize: s.font }]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
