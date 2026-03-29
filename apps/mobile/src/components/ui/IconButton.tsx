import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { theme } from '../../ui/theme';
import type { Theme } from '../../ui/theme';

export function IconButton({ name, size = 24, color = theme.colors.text, onPress }: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string; onPress?: () => void }) {
  const themeCtx = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.pressed]} hitSlop={8}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  btn: { padding: 8, borderRadius: 999 },
  pressed: { opacity: 0.6 },
});
