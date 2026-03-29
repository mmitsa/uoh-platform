import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Segment { key: string; label: string }

export function SegmentedControl({ segments, selected, onSelect }: { segments: Segment[]; selected: string; onSelect: (key: string) => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {segments.map(s => (
        <Pressable key={s.key} onPress={() => onSelect(s.key)} style={[styles.item, selected === s.key && styles.active]}>
          <Text style={[styles.text, selected === s.key && styles.activeText]}>{s.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  item: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.borderLight },
  active: { backgroundColor: theme.colors.primary },
  text: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
  activeText: { color: '#fff' },
});
