import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { Mom, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  approved: 'success', pending_approval: 'warning', rejected: 'danger', draft: 'default',
};

export function MomsListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['moms'],
    queryFn: () => api.get<PagedResponse<Mom>>('/api/v1/moms'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('moms.title')}</Text>
      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('MomDetail', { id: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{isAr ? item.meetingTitleAr : item.meetingTitleEn}</Text>
              <Text style={styles.meta}>{item.preparedByDisplayName} — {new Date(item.createdAtUtc).toLocaleDateString()}</Text>
            </View>
            <Badge variant={statusVariant[item.status] ?? 'default'} label={t(`moms.statuses.${item.status}`, item.status)} size="sm" />
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
