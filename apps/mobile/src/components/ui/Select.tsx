import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';

interface Option { value: string; label: string }

interface Props {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ label, options, value, onChange, placeholder }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerWrap}>
        <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
          {placeholder && <Picker.Item label={placeholder} value="" />}
          {options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
        </Picker>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 4 },
  pickerWrap: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  picker: { height: 44 },
});
