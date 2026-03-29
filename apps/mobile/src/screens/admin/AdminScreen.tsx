import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

/* ---- Types ---- */

interface AdminMenuItem {
  key: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  color: string;
}

/* ---- Menu Items ---- */

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    key: 'users',
    labelKey: 'admin.usersManagement',
    icon: 'people',
    screen: 'UsersList',
    color: '#2563eb',
  },
  {
    key: 'roles',
    labelKey: 'admin.roles',
    icon: 'shield-checkmark',
    screen: 'Roles',
    color: '#7c3aed',
  },
  {
    key: 'announcements',
    labelKey: 'admin.announcements',
    icon: 'megaphone',
    screen: 'AdminAnnouncements',
    color: '#ea580c',
  },
  {
    key: 'adSync',
    labelKey: 'admin.adSync',
    icon: 'sync-circle',
    screen: 'AdSync',
    color: '#0891b2',
  },
  {
    key: 'acknowledgments',
    labelKey: 'admin.acknowledgmentsAdmin',
    icon: 'document-text',
    screen: 'AcknowledgmentsAdmin',
    color: '#16a34a',
  },
];

/* ---- Component ---- */

export function AdminScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();

  if (!hasRole('SystemAdmin')) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <EmptyState
          icon="lock-closed-outline"
          title={t('admin.accessDenied')}
          message={t('admin.accessDeniedDesc')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin.title')}</Text>
          <Text style={styles.subtitle}>{t('admin.subtitle')}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield" size={16} color="#fff" />
          <Text style={styles.adminBadgeText}>{t('admin.systemAdmin')}</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfoCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRoles}>{user?.roles.join(', ')}</Text>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.grid}>
        {ADMIN_MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text style={styles.gridLabel}>{t(item.labelKey)}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 14,
    marginBottom: 24,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  userName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  userEmail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  userRoles: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    width: '47%' as any,
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  gridItemPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  gridIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
});
