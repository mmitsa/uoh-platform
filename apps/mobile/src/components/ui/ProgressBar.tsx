import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  progress: number; // 0-100
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 6, color }: Props) {
  const theme = useTheme();
  const fillColor = color ?? theme.colors.primary;
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.track, { height, backgroundColor: theme.colors.border }]}>
      <View style={[styles.fill, { width: `${pct}%`, height, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
});
