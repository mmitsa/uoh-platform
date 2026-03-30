import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import type { Theme } from '../ui/theme';

export function NotificationBell({ count = 0, onPress }: { count?: number; onPress?: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  badge: { position: 'absolute', top: -4, end: -6, backgroundColor: theme.colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
