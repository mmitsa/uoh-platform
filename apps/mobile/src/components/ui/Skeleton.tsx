import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { theme } from '../../ui/theme';
import type { Theme } from '../../ui/theme';

export function Skeleton({ width, height = 16, radius = theme.radius.sm, style }: { width?: number | string; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const themeCtx = useTheme();
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { width: width as number, height, borderRadius: radius, opacity }, style]} />;
}

const createStyles = (theme: Theme) => StyleSheet.create({
  skeleton: { backgroundColor: theme.colors.border },
});
