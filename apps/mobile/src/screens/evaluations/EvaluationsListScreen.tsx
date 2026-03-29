import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Evaluation, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { DataList, Fab, ProgressBar } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

export function EvaluationsListScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => api.get<PagedResponse<Evaluation>>('/api/v1/evaluations'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  function scoreColor(score?: number, max = 100): string {
    if (score == null) return theme.colors.textMuted;
    const pct = (score / max) * 100;
    if (pct >= 75) return theme.colors.success;
    if (pct >= 50) return theme.colors.warning;
    return theme.colors.danger;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('evaluations.title')}</Text>

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const score = item.overallScore ?? 0;
          const maxScore = 100;
          return (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('EvaluationDetail', { id: item.id })}
            >
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreText, { color: scoreColor(score, maxScore) }]}>
                  {score}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evaluator}>{item.evaluatorDisplayName}</Text>
                <Text style={styles.meta}>
                  {new Date(item.periodStart).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  {' — '}
                  {new Date(item.periodEnd).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </Text>
                <ProgressBar progress={score} height={4} color={scoreColor(score, maxScore)} />
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>
          );
        }}
      />

      <Fab onPress={() => navigation.navigate('EvaluationForm', {})} />
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
      paddingBottom: 8,
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
    scoreCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: { fontSize: 18, fontWeight: '800' },
    evaluator: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, marginBottom: 6 },
  });
