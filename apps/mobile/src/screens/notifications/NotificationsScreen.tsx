import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { NotificationItem, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function NotificationsScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<PagedResponse<NotificationItem>>('/api/v1/notifications'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('notifications.title')}</Text>
      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('notifications.empty')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.isRead && styles.unread]}>
            <Ionicons name={item.isRead ? 'mail-open-outline' : 'mail-outline'} size={20} color={item.isRead ? theme.colors.textMuted : theme.colors.primary} />
            <View style={{ flex: 1, marginStart: 12 }}>
              <Text style={styles.notifTitle}>{isAr ? item.titleAr : item.titleEn}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{isAr ? item.bodyAr : item.bodyEn}</Text>
              <Text style={styles.notifDate}>{new Date(item.createdAtUtc).toLocaleString()}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16 },
  item: { flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
  unread: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  notifTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  notifBody: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  notifDate: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },
});
