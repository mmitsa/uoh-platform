import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { SurveyItem, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function SurveysListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => api.get<PagedResponse<SurveyItem>>('/api/v1/surveys'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('surveys.title')}</Text>
      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('SurveyDetail', { id: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{isAr ? item.titleAr : item.titleEn}</Text>
              <Text style={styles.meta}>{t('surveys.responses')}: {item.totalResponses ?? 0}</Text>
            </View>
            <Badge variant={item.status === 'active' ? 'success' : 'default'} label={t(`surveys.statuses.${item.status}`, item.status)} size="sm" />
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
