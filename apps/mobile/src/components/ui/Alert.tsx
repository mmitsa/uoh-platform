import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

type Variant = 'info' | 'success' | 'warning' | 'error';

const variantColors: Record<Variant, { bg: string; fg: string; border: string }> = {
  info: { bg: '#dbeafe', fg: '#1d4ed8', border: '#93c5fd' },
  success: { bg: '#dcfce7', fg: '#15803d', border: '#86efac' },
  warning: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  error: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
};

export function Alert({ variant = 'info', title, message }: { variant?: Variant; title?: string; message: string }) {
  const styles = useThemedStyles(createStyles);
  const c = variantColors[variant];
  return (
    <View style={[styles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
      {title && <Text style={[styles.title, { color: c.fg }]}>{title}</Text>}
      <Text style={[styles.msg, { color: c.fg }]}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  box: { borderWidth: 1, borderRadius: theme.radius.sm, padding: 12 },
  title: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
  msg: { fontSize: 13 },
});
