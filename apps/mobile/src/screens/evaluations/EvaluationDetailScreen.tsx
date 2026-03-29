import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Evaluation, EvaluationTemplate } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, LoadingSpinner, ProgressBar } from '../../components/ui';

export function EvaluationDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => api.get<Evaluation>(`/api/v1/evaluations/${id}`),
  });

  /* Optionally load the template to show criteria labels */
  const { data: template } = useQuery({
    queryKey: ['evaluation-template', data?.templateId],
    queryFn: () => api.get<EvaluationTemplate>(`/api/v1/evaluation-templates/${data!.templateId}`),
    enabled: Boolean(data?.templateId),
  });

  if (isLoading || !data) return <LoadingSpinner />;

  const overallScore = data.overallScore ?? 0;
  const maxScore = template?.maxScore ?? 100;
  const pct = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;

  function scoreColor(score: number, max: number): string {
    const p = max > 0 ? (score / max) * 100 : 0;
    if (p >= 75) return theme.colors.success;
    if (p >= 50) return theme.colors.warning;
    return theme.colors.danger;
  }

  /* Map criteriaId to its template definition for labels */
  const criteriaMap = new Map(
    (template?.criteria ?? []).map((c) => [c.id, c]),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.heading}>{t('evaluations.detail')}</Text>

          <Text style={styles.label}>{t('evaluations.evaluator')}</Text>
          <Text style={styles.value}>{data.evaluatorDisplayName}</Text>

          <Text style={styles.label}>{t('evaluations.period')}</Text>
          <Text style={styles.value}>
            {new Date(data.periodStart).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
            {' — '}
            {new Date(data.periodEnd).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </Text>

          {(isAr ? data.overallNotesAr : data.overallNotesEn) && (
            <>
              <Text style={styles.label}>{t('evaluations.notes')}</Text>
              <Text style={styles.notesText}>
                {isAr ? data.overallNotesAr : data.overallNotesEn}
              </Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* Overall Score */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('evaluations.overallScore')}</Text>
          <View style={styles.overallRow}>
            <View style={[styles.bigScoreCircle, { borderColor: scoreColor(overallScore, maxScore) }]}>
              <Text style={[styles.bigScoreText, { color: scoreColor(overallScore, maxScore) }]}>
                {overallScore}
              </Text>
              <Text style={styles.bigScoreMax}>/ {maxScore}</Text>
            </View>
            <View style={{ flex: 1, marginStart: 16 }}>
              <Text style={styles.pctText}>{pct.toFixed(1)}%</Text>
              <ProgressBar progress={pct} height={8} color={scoreColor(overallScore, maxScore)} />
            </View>
          </View>
        </CardBody>
      </Card>

      {/* Criteria Scores */}
      {data.responses && data.responses.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('evaluations.criteriaScores')}</Text>
            {data.responses.map((resp, idx) => {
              const criteria = criteriaMap.get(resp.criteriaId);
              const criteriaLabel = criteria
                ? isAr
                  ? criteria.labelAr
                  : criteria.labelEn
                : `${t('evaluations.criteria')} ${idx + 1}`;
              const criteriaMax = criteria?.maxScore ?? 10;
              const criteriaPct = criteriaMax > 0 ? (resp.score / criteriaMax) * 100 : 0;

              return (
                <View key={resp.criteriaId} style={styles.criteriaRow}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaLabel}>{criteriaLabel}</Text>
                    <Text style={[styles.criteriaScore, { color: scoreColor(resp.score, criteriaMax) }]}>
                      {resp.score}/{criteriaMax}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={criteriaPct}
                    height={6}
                    color={scoreColor(resp.score, criteriaMax)}
                  />
                  {resp.notes && (
                    <Text style={styles.criteriaNotes}>{resp.notes}</Text>
                  )}
                </View>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={() => navigation.navigate('EvaluationForm', { id })}
          style={{ flex: 1 }}
        >
          {t('actions.edit')}
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    heading: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 16,
      textTransform: 'uppercase',
    },
    value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
    notesText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },

    /* Overall Score */
    overallRow: { flexDirection: 'row', alignItems: 'center' },
    bigScoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigScoreText: { fontSize: 24, fontWeight: '800' },
    bigScoreMax: { fontSize: 11, color: theme.colors.textMuted },
    pctText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },

    /* Criteria */
    criteriaRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    criteriaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    criteriaLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, flex: 1 },
    criteriaScore: { fontSize: 15, fontWeight: '700' },
    criteriaNotes: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },

    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  });
