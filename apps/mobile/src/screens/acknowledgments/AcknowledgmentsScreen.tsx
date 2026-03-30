import React, { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { UserAcknowledgment } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function AcknowledgmentsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [tab, setTab] = useState('pending');

  const segments = [
    { key: 'pending', label: t('acknowledgments.pending') },
    { key: 'history', label: t('acknowledgments.history') },
  ];

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['acknowledgments-pending'],
    queryFn: () => api.get<UserAcknowledgment[]>('/api/v1/acknowledgments/pending'),
    enabled: tab === 'pending',
  });

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['acknowledgments-history'],
    queryFn: () => api.get<UserAcknowledgment[]>('/api/v1/acknowledgments/my-history'),
    enabled: tab === 'history',
  });

  const { refreshing: pendingRefreshing, onRefresh: onPendingRefresh } =
    useRefreshControl(refetchPending);
  const { refreshing: historyRefreshing, onRefresh: onHistoryRefresh } =
    useRefreshControl(refetchHistory);

  const isPending = tab === 'pending';
  const currentData = isPending ? pendingData : historyData;
  const currentLoading = isPending ? pendingLoading : historyLoading;
  const currentRefreshing = isPending ? pendingRefreshing : historyRefreshing;
  const currentOnRefresh = isPending ? onPendingRefresh : onHistoryRefresh;

  function isExpired(item: UserAcknowledgment): boolean {
    if (!item.expiresAtUtc) return false;
    return new Date(item.expiresAtUtc) < new Date();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('acknowledgments.title')}</Text>
      <SegmentedControl segments={segments} selected={tab} onSelect={setTab} />

      <DataList
        data={currentData}
        isLoading={currentLoading}
        refreshing={currentRefreshing}
        onRefresh={currentOnRefresh}
        emptyTitle={
          isPending
            ? t('acknowledgments.noPending')
            : t('acknowledgments.noHistory')
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const acknowledged = Boolean(item.acknowledgedAtUtc);
          const expired = isExpired(item);

          return (
            <Pressable
              style={styles.item}
              onPress={() =>
                navigation.navigate('AcknowledgmentDetail', { id: item.id })
              }
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: acknowledged
                      ? theme.colors.success + '15'
                      : expired
                        ? theme.colors.danger + '15'
                        : theme.colors.warning + '15',
                  },
                ]}
              >
                <Ionicons
                  name={
                    acknowledged
                      ? 'checkmark-circle'
                      : expired
                        ? 'alert-circle'
                        : 'time-outline'
                  }
                  size={22}
                  color={
                    acknowledged
                      ? theme.colors.success
                      : expired
                        ? theme.colors.danger
                        : theme.colors.warning
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {isAr ? item.titleAr : item.titleEn}
                </Text>
                <View style={styles.metaRow}>
                  <Badge
                    variant={item.isMandatory ? 'danger' : 'default'}
                    label={
                      item.isMandatory
                        ? t('acknowledgments.mandatory')
                        : t('acknowledgments.optional')
                    }
                    size="sm"
                  />
                  <Text style={styles.meta}>{item.category}</Text>
                </View>
                {acknowledged && item.acknowledgedAtUtc && (
                  <Text style={styles.dateText}>
                    {t('acknowledgments.acknowledgedOn')}{' '}
                    {new Date(item.acknowledgedAtUtc).toLocaleDateString(
                      isAr ? 'ar-SA' : 'en-US',
                    )}
                  </Text>
                )}
                {item.expiresAtUtc && (
                  <Text
                    style={[
                      styles.dateText,
                      expired && { color: theme.colors.danger },
                    ]}
                  >
                    {t('acknowledgments.expiresOn')}{' '}
                    {new Date(item.expiresAtUtc).toLocaleDateString(
                      isAr ? 'ar-SA' : 'en-US',
                    )}
                  </Text>
                )}
              </View>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={theme.colors.textMuted}
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
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    metaRow: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
    meta: { fontSize: 12, color: theme.colors.textMuted },
    dateText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  });
