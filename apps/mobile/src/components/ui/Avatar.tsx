import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  avatar: { backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  text: { color: theme.colors.primary, fontWeight: '700' },
});
