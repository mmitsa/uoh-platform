import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { CommitteeItem, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Fab, Input } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useDebounce } from '../../hooks/useDebounce';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active: 'success', draft: 'default', pending_approval: 'warning', suspended: 'danger', closed: 'info',
};

export function CommitteesListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['committees', debouncedSearch],
    queryFn: () => api.get<PagedResponse<CommitteeItem>>(`/api/v1/committees?search=${debouncedSearch}`),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('committees.title')}</Text>
        <Input placeholder={t('actions.search')} value={search} onChangeText={setSearch} containerStyle={{ marginTop: 8 }} />
      </View>

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('CommitteeDetail', { id: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{isAr ? item.nameAr : item.nameEn}</Text>
              <Text style={styles.type}>{t(`committees.types.${item.type}`, item.type)}</Text>
            </View>
            <Badge variant={statusVariant[item.status] ?? 'default'} label={t(`committees.statuses.${item.status}`, item.status)} size="sm" />
          </Pressable>
        )}
      />
      <Fab onPress={() => navigation.navigate('CommitteeForm', {})} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  type: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
