import React from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Props { children: React.ReactNode; style?: StyleProp<ViewStyle> }

export function Card({ children, style }: Props) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}
export function CardHeader({ children, style }: Props) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.header, style]}>{children}</View>;
}
export function CardBody({ children, style }: Props) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.body, style]}>{children}</View>;
}
export function CardFooter({ children, style }: Props) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.footer, style]}>{children}</View>;
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight, overflow: 'hidden' },
  header: { padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  body: { padding: theme.spacing.lg },
  footer: { padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
});
