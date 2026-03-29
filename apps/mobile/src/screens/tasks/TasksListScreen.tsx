import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { TaskItem, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Fab, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'default', in_progress: 'warning', completed: 'success', overdue: 'danger', cancelled: 'info',
};

export function TasksListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();

  const priorityColors: Record<string, string> = { low: theme.colors.info, medium: theme.colors.warning, high: '#ea580c', critical: theme.colors.danger };
  const isAr = i18n.language === 'ar';
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => api.get<PagedResponse<TaskItem>>(`/api/v1/tasks${filter !== 'all' ? `?status=${filter}` : ''}`),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const segments = [
    { key: 'all', label: t('common.all') },
    { key: 'pending', label: t('tasks.statuses.pending') },
    { key: 'in_progress', label: t('tasks.statuses.in_progress') },
    { key: 'overdue', label: t('tasks.statuses.overdue') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('tasks.title')}</Text>
      <SegmentedControl segments={segments} selected={filter} onSelect={setFilter} />

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('TaskDetail', { id: item.id })}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColors[item.priority] ?? theme.colors.textMuted }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{isAr ? item.titleAr : item.titleEn}</Text>
              <Text style={styles.meta}>{item.assignedToDisplayName} — {new Date(item.dueDateUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</Text>
              {/* Progress bar */}
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${item.progressPercent ?? 0}%` }]} />
              </View>
            </View>
            <Badge variant={statusVariant[item.status] ?? 'default'} label={t(`tasks.statuses.${item.status}`, item.status)} size="sm" />
          </Pressable>
        )}
      />
      <Fab onPress={() => navigation.navigate('TaskForm', {})} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, paddingHorizontal: 16, paddingTop: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 12 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  progressBg: { height: 4, backgroundColor: theme.colors.borderLight, borderRadius: 2, marginTop: 6 },
  progressFill: { height: 4, backgroundColor: theme.colors.primary, borderRadius: 2 },
});
