import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
}

export function DateTimePicker({ label, value, onChange, mode = 'date', minimumDate }: Props) {
  const theme = useTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <View style={styles.row}>
        {(mode === 'date' || mode === 'datetime') && (
          <Pressable
            style={[styles.field, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setShowDate(true)}
          >
            <Text style={{ color: theme.colors.text }}>{formatDate(value)}</Text>
          </Pressable>
        )}
        {(mode === 'time' || mode === 'datetime') && (
          <Pressable
            style={[styles.field, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setShowTime(true)}
          >
            <Text style={{ color: theme.colors.text }}>{formatTime(value)}</Text>
          </Pressable>
        )}
      </View>
      {showDate && (
        <RNDateTimePicker
          value={value}
          mode="date"
          minimumDate={minimumDate}
          onChange={(_, d) => { setShowDate(false); if (d) onChange(d); }}
        />
      )}
      {showTime && (
        <RNDateTimePicker
          value={value}
          mode="time"
          onChange={(_, d) => { setShowTime(false); if (d) onChange(d); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
});
