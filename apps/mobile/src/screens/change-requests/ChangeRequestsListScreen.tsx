import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { ChangeRequest, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  approved: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
};

export function ChangeRequestsListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['change-requests', filter],
    queryFn: () =>
      api.get<PagedResponse<ChangeRequest>>(
        `/api/v1/change-requests${filter !== 'all' ? `?status=${filter}` : ''}`,
      ),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const segments = [
    { key: 'all', label: t('common.all') },
    { key: 'pending', label: t('changeRequests.statuses.pending') },
    { key: 'approved', label: t('changeRequests.statuses.approved') },
    { key: 'rejected', label: t('changeRequests.statuses.rejected') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('changeRequests.title')}</Text>
      <SegmentedControl segments={segments} selected={filter} onSelect={setFilter} />

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusIcon = STATUS_ICON[item.status] ?? 'help-circle-outline';
          const statusColor =
            item.status === 'approved'
              ? theme.colors.success
              : item.status === 'rejected'
                ? theme.colors.danger
                : theme.colors.warning;

          return (
            <Pressable
              style={styles.item}
              onPress={() =>
                navigation.navigate('ChangeRequestDetail', { id: item.id })
              }
            >
              <View style={[styles.iconWrapper, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name={statusIcon} size={22} color={statusColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.committeeName} numberOfLines={1}>
                  {isAr ? item.committeeNameAr : item.committeeNameEn}
                </Text>
                <Text style={styles.reason} numberOfLines={2}>
                  {isAr ? item.reasonAr : item.reasonEn}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{item.requesterDisplayName}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </Text>
                </View>
              </View>
              <Badge
                variant={STATUS_VARIANT[item.status] ?? 'default'}
                label={t(`changeRequests.statuses.${item.status}`, item.status)}
                size="sm"
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 14,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      gap: 12,
    },
    iconWrapper: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    committeeName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    reason: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    meta: { fontSize: 11, color: theme.colors.textMuted },
  });
