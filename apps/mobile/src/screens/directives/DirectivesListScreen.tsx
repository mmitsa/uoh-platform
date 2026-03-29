import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Directive, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, DataList, Fab, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'warning',
  active: 'success',
  closed: 'default',
};

export function DirectivesListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['directives', filter],
    queryFn: () =>
      api.get<PagedResponse<Directive>>(
        `/api/v1/directives${filter !== 'all' ? `?status=${filter}` : ''}`,
      ),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const segments = [
    { key: 'all', label: t('common.all') },
    { key: 'draft', label: t('directives.statuses.draft') },
    { key: 'active', label: t('directives.statuses.active') },
    { key: 'closed', label: t('directives.statuses.closed') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('directives.title')}</Text>
      <SegmentedControl segments={segments} selected={filter} onSelect={setFilter} />

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => navigation.navigate('DirectiveDetail', { id: item.id })}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="megaphone-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {isAr ? item.titleAr : item.titleEn}
              </Text>
              <View style={styles.metaRow}>
                {item.referenceNumber && (
                  <Text style={styles.meta}>#{item.referenceNumber}</Text>
                )}
                {item.issuedBy && (
                  <Text style={styles.meta}>{item.issuedBy}</Text>
                )}
                <Text style={styles.meta}>
                  {new Date(item.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </Text>
              </View>
            </View>
            <Badge
              variant={STATUS_VARIANT[item.status] ?? 'default'}
              label={t(`directives.statuses.${item.status}`, item.status)}
              size="sm"
            />
          </Pressable>
        )}
      />

      <Fab onPress={() => navigation.navigate('DirectiveForm', {})} />
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
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    metaRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    meta: { fontSize: 12, color: theme.colors.textMuted },
  });
