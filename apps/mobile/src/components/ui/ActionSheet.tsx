import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomSheet } from './BottomSheet';

export interface ActionSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, title, options }: Props) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
      {options.map((opt, i) => (
        <Pressable
          key={i}
          style={[styles.option, { borderBottomColor: theme.colors.border }]}
          onPress={() => { onClose(); opt.onPress(); }}
        >
          {opt.icon && (
            <Ionicons name={opt.icon} size={22} color={opt.destructive ? theme.colors.danger : theme.colors.text} style={{ marginRight: 12 }} />
          )}
          <Text style={[styles.optionText, { color: opt.destructive ? theme.colors.danger : theme.colors.text }]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 16 },
});
