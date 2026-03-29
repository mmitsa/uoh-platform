import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'moms', icon: 'document-text-outline', screen: 'MomsList' },
  { key: 'voting', icon: 'thumbs-up-outline', screen: 'VotingList' },
  { key: 'surveys', icon: 'clipboard-outline', screen: 'SurveysList' },
  { key: 'reports', icon: 'bar-chart-outline', screen: 'Reports' },
  { key: 'workflow', icon: 'git-branch-outline', screen: 'Workflow' },
  { key: 'attachments', icon: 'attach-outline', screen: 'Attachments' },
  { key: 'admin', icon: 'shield-checkmark-outline', screen: 'Admin' },
  { key: 'settings', icon: 'settings-outline', screen: 'Settings' },
  { key: 'profile', icon: 'person-outline', screen: 'Profile' },
];

export function MoreMenuScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{t('more.title')}</Text>

      <View style={styles.card}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable key={item.key} style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.borderBottom]}
            onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
            <Text style={styles.menuText}>{t(`more.${item.key}`)}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
        <Text style={styles.menuText}>{t('notifications.title')}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Pressable style={[styles.logoutBtn]} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
        <Text style={[styles.menuText, { color: theme.colors.danger }]}>{t('auth.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, marginTop: 16, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight },
});
