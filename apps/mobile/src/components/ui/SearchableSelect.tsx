import React, { useState, useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onSelect: (value: string) => void;
  containerStyle?: object;
}

export function SearchableSelect({ label, placeholder, options, value, onSelect, containerStyle }: Props) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find(o => o.value === value);
  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <View style={containerStyle}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Pressable
        style={[styles.field, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: selected ? theme.colors.text : theme.colors.textMuted, flex: 1 }}>
          {selected?.label ?? placeholder ?? '—'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TextInput
              style={[styles.search, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <Pressable onPress={() => { setVisible(false); setSearch(''); }}>
              <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={i => i.value}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, item.value === value && { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => { onSelect(item.value); setVisible(false); setSearch(''); }}
              >
                <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{item.label}</Text>
                {item.sublabel && <Text style={[styles.itemSub, { color: theme.colors.textMuted }]}>{item.sublabel}</Text>}
                {item.value === value && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
  modal: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderBottomWidth: 1 },
  search: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 15 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  itemLabel: { flex: 1, fontSize: 15 },
  itemSub: { fontSize: 12, marginEnd: 8 },
});
