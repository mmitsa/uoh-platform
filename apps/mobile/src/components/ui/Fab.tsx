import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

export function Fab({ icon = 'add', onPress }: { icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Ionicons name={icon} size={28} color="#fff" />
    </Pressable>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  fab: { position: 'absolute', bottom: 24, end: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
});
