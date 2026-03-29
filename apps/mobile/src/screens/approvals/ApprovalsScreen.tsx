import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { ApprovalItem } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  meeting: 'calendar-outline',
  mom: 'document-text-outline',
  committee: 'people-outline',
  changeRequest: 'git-pull-request-outline',
};

const TYPE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'brand'> = {
  meeting: 'info',
  mom: 'brand',
  committee: 'success',
  changeRequest: 'warning',
};

export function ApprovalsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => api.get<ApprovalItem[]>('/api/v1/approvals/pending'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const approveMut = useMutation({
    mutationFn: (itemId: string) => api.post(`/api/v1/approvals/${itemId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals-pending'] });
      Alert.alert(t('common.success'), t('approvals.approvedSuccess'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const rejectMut = useMutation({
    mutationFn: (itemId: string) => api.post(`/api/v1/approvals/${itemId}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals-pending'] });
      Alert.alert(t('common.success'), t('approvals.rejectedSuccess'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleApprove = (item: ApprovalItem) => {
    Alert.alert(
      t('approvals.approve'),
      t('approvals.approveConfirm', { title: isAr ? item.titleAr : item.titleEn }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('approvals.approve'), onPress: () => approveMut.mutate(item.id) },
      ],
    );
  };

  const handleReject = (item: ApprovalItem) => {
    Alert.alert(
      t('approvals.reject'),
      t('approvals.rejectConfirm', { title: isAr ? item.titleAr : item.titleEn }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('approvals.reject'),
          style: 'destructive',
          onPress: () => rejectMut.mutate(item.id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('approvals.title')}</Text>
      <Text style={styles.subtitle}>
        {t('approvals.pendingCount', { count: data?.length ?? 0 })}
      </Text>

      <DataList
        data={data}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('approvals.noPending')}
        emptyMessage={t('approvals.allCaughtUp')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const icon = TYPE_ICON[item.type] ?? 'alert-circle-outline';
          const variant = TYPE_VARIANT[item.type] ?? 'default';

          return (
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Ionicons name={icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {isAr ? item.titleAr : item.titleEn}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Badge variant={variant} label={t(`approvals.types.${item.type}`, item.type)} size="sm" />
                    <Text style={styles.metaText}>{item.requestedBy}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    {new Date(item.requestedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => handleApprove(item)}
                  loading={approveMut.isPending}
                  icon={<Ionicons name="checkmark" size={16} color="#fff" />}
                  style={{ flex: 1 }}
                >
                  {t('approvals.approve')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => handleReject(item)}
                  loading={rejectMut.isPending}
                  icon={<Ionicons name="close" size={16} color="#fff" />}
                  style={{ flex: 1 }}
                >
                  {t('approvals.reject')}
                </Button>
              </View>
            </View>
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
    subtitle: {
      fontSize: 14,
      color: theme.colors.textMuted,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    item: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 14,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    itemHeader: { flexDirection: 'row', gap: 12 },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    itemMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
    metaText: { fontSize: 12, color: theme.colors.textMuted },
    dateText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  });
