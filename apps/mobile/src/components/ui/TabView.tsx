import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
  initialTab?: string;
}

export function TabView({ tabs, initialTab }: Props) {
  const theme = useTheme();
  const [active, setActive] = useState(initialTab ?? tabs[0]?.key);
  const currentTab = tabs.find(t => t.key === active);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.bar, { borderBottomColor: theme.colors.border }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, active === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActive(tab.key)}
          >
            <Text style={[styles.tabText, { color: active === tab.key ? theme.colors.primary : theme.colors.textMuted }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.content}>{currentTab?.content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: { flexGrow: 0, borderBottomWidth: 1 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
});
