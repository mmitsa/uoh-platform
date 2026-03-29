import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

export function LoadingSpinner({ overlay = false }: { overlay?: boolean }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay, alignItems: 'center', justifyContent: 'center', zIndex: 999 },
});
