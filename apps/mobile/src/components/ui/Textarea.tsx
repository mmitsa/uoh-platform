import React from 'react';
import { I18nManager, StyleSheet, Text, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Textarea({ label, error, containerStyle, style, ...rest }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        textAlign={I18nManager.isRTL ? 'right' : 'left'}
        placeholderTextColor={theme.colors.textMuted}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.colors.text, backgroundColor: theme.colors.surface, minHeight: 100 },
  inputError: { borderColor: theme.colors.danger },
  error: { fontSize: 12, color: theme.colors.danger, marginTop: 4 },
});
