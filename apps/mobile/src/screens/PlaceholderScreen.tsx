import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import type { Theme } from '../ui/theme';

export function PlaceholderScreen({ name }: { name: string }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.sub}>Coming soon...</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  text: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8 },
});
