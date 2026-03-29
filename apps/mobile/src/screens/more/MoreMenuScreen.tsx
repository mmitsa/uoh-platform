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

const CORE_ITEMS: MenuItem[] = [
  { key: 'moms', icon: 'document-text-outline', screen: 'MomsList' },
  { key: 'voting', icon: 'thumbs-up-outline', screen: 'VotingList' },
  { key: 'surveys', icon: 'clipboard-outline', screen: 'SurveysList' },
  { key: 'directives', icon: 'megaphone-outline', screen: 'Directives' },
  { key: 'evaluations', icon: 'star-outline', screen: 'Evaluations' },
  { key: 'acknowledgments', icon: 'checkmark-done-outline', screen: 'Acknowledgments' },
  { key: 'approvals', icon: 'thumbs-up-outline', screen: 'Approvals' },
  { key: 'changeRequests', icon: 'swap-horizontal-outline', screen: 'ChangeRequests' },
];

const RESOURCES_ITEMS: MenuItem[] = [
  { key: 'reports', icon: 'bar-chart-outline', screen: 'Reports' },
  { key: 'workflow', icon: 'git-branch-outline', screen: 'Workflow' },
  { key: 'attachments', icon: 'attach-outline', screen: 'Attachments' },
  { key: 'locations', icon: 'location-outline', screen: 'Locations' },
  { key: 'roomBooking', icon: 'business-outline', screen: 'RoomBooking' },
  { key: 'archive', icon: 'archive-outline', screen: 'MyArchive' },
];

const SYSTEM_ITEMS: MenuItem[] = [
  { key: 'admin', icon: 'shield-checkmark-outline', screen: 'Admin' },
  { key: 'settings', icon: 'settings-outline', screen: 'Settings' },
  { key: 'profile', icon: 'person-outline', screen: 'Profile' },
];

export function MoreMenuScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { logout } = useAuth();

  const renderSection = (title: string, items: MenuItem[]) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, i) => (
          <Pressable
            key={item.key}
            style={[styles.menuItem, i < items.length - 1 && styles.borderBottom]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
            <Text style={styles.menuText}>{t(`more.${item.key}`)}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{t('more.title')}</Text>

      {renderSection(t('more.sectionCore', 'Features'), CORE_ITEMS)}
      {renderSection(t('more.sectionResources', 'Resources'), RESOURCES_ITEMS)}
      {renderSection(t('more.sectionSystem', 'System'), SYSTEM_ITEMS)}

      <Pressable style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
        <Text style={styles.menuText}>{t('notifications.title')}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
        <Text style={[styles.menuText, { color: theme.colors.danger }]}>{t('auth.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
  notificationBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, marginTop: 8, marginBottom: 32, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderLight },
});
