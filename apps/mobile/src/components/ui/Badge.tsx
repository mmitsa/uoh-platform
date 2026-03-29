import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../contexts/ThemeContext';
import { theme } from '../../ui/theme';
import type { Theme } from '../../ui/theme';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const colorMap: Record<Variant, { bg: string; fg: string }> = {
  default: { bg: theme.colors.borderLight, fg: theme.colors.textSecondary },
  success: { bg: '#dcfce7', fg: '#15803d' },
  warning: { bg: '#fef3c7', fg: '#b45309' },
  danger: { bg: '#fee2e2', fg: '#b91c1c' },
  info: { bg: '#dbeafe', fg: '#1d4ed8' },
  brand: { bg: theme.colors.primaryLight, fg: theme.colors.primary },
};

export function Badge({ variant = 'default', label, size = 'md' }: { variant?: Variant; label: string; size?: 'sm' | 'md' }) {
  const styles = useThemedStyles(createStyles);
  const c = colorMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'sm' ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: c.fg }, size === 'sm' && { fontSize: 11 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999 },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  md: { paddingHorizontal: 12, paddingVertical: 4 },
  text: { fontWeight: '600', fontSize: 13 },
});
