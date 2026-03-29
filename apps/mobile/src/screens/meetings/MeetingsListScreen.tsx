import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { MeetingItem, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Fab, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  scheduled: 'info', draft: 'default', in_progress: 'warning', completed: 'success', cancelled: 'danger',
};

export function MeetingsListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['meetings', filter],
    queryFn: () => api.get<PagedResponse<MeetingItem>>(`/api/v1/meetings${filter !== 'all' ? `?status=${filter}` : ''}`),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const segments = [
    { key: 'all', label: t('common.all') },
    { key: 'scheduled', label: t('meetings.statuses.scheduled') },
    { key: 'completed', label: t('meetings.statuses.completed') },
  ];

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.title}>{t('meetings.title')}</Text>
        <Pressable onPress={() => navigation.navigate('Calendar')} style={{ padding: 8 }}>
          <Ionicons name="calendar" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>
      <SegmentedControl segments={segments} selected={filter} onSelect={setFilter} />

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('MeetingDetail', { id: item.id })}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            <View style={{ flex: 1, marginStart: 12 }}>
              <Text style={styles.name}>{isAr ? item.titleAr : item.titleEn}</Text>
              <Text style={styles.date}>{new Date(item.startDateTimeUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium' })}</Text>
            </View>
            <Badge variant={statusVariant[item.status] ?? 'default'} label={t(`meetings.statuses.${item.status}`, item.status)} size="sm" />
          </Pressable>
        )}
      />
      <Fab onPress={() => navigation.navigate('MeetingForm', {})} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, paddingHorizontal: 16, paddingTop: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  date: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
