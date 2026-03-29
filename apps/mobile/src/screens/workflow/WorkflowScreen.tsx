import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { WorkflowTemplate, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function WorkflowScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get<PagedResponse<WorkflowTemplate>>('/api/v1/workflow/templates'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('workflow.title')}</Text>
      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('WorkflowDetail', { id: item.id })}>
            <Ionicons name="git-branch-outline" size={22} color={theme.colors.primary} />
            <View style={{ flex: 1, marginStart: 12 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.domain}>{item.domain}</Text>
            </View>
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
  domain: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
