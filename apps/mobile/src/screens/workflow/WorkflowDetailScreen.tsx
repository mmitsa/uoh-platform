import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { WorkflowTemplate } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Card, CardBody, LoadingSpinner } from '../../components/ui';

/* ---- Workflow Definition Types ---- */

interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type?: 'start' | 'action' | 'decision' | 'approval' | 'end' | string;
  state?: 'pending' | 'active' | 'completed' | 'skipped' | 'failed' | string;
  assignee?: string;
  order?: number;
  nextSteps?: string[];
}

interface WorkflowDefinition {
  steps: WorkflowStep[];
  name?: string;
  description?: string;
}

/* ---- Helpers ---- */

function parseDefinition(json?: string): WorkflowDefinition | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed.steps && Array.isArray(parsed.steps)) return parsed as WorkflowDefinition;
    /* If the JSON is just an array of steps */
    if (Array.isArray(parsed)) return { steps: parsed };
    return null;
  } catch {
    return null;
  }
}

const STEP_TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  start: 'play-circle-outline',
  action: 'cog-outline',
  decision: 'git-branch-outline',
  approval: 'shield-checkmark-outline',
  end: 'flag-outline',
};

const STATE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  completed: { color: '#16a34a', icon: 'checkmark-circle', variant: 'success' },
  active: { color: '#2563eb', icon: 'radio-button-on', variant: 'info' },
  pending: { color: '#94a3b8', icon: 'ellipse-outline', variant: 'default' },
  skipped: { color: '#64748b', icon: 'remove-circle-outline', variant: 'default' },
  failed: { color: '#dc2626', icon: 'close-circle', variant: 'danger' },
};

/* ---- Component ---- */

export function WorkflowDetailScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api.get<WorkflowTemplate>(`/api/v1/workflow-templates/${id}`),
  });

  const definition = useMemo(() => parseDefinition(data?.definitionJson), [data?.definitionJson]);

  if (isLoading || !data) return <LoadingSpinner />;

  const sortedSteps = definition?.steps
    ? [...definition.steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  /* Calculate progress */
  const completedCount = sortedSteps.filter((s) => s.state === 'completed').length;
  const totalCount = sortedSteps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{data.name}</Text>
          <Text style={styles.domain}>{data.domain}</Text>

          {definition?.description && (
            <Text style={styles.description}>{definition.description}</Text>
          )}

          {/* Progress summary */}
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>{t('workflow.progress')}</Text>
              <Text style={styles.progressValue}>{progressPct}%</Text>
            </View>
            <Text style={styles.progressDetail}>
              {completedCount}/{totalCount} {t('workflow.stepsCompleted')}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%` },
              ]}
            />
          </View>
        </CardBody>
      </Card>

      {/* Steps Timeline */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('workflow.steps')}</Text>

          {sortedSteps.length === 0 ? (
            <View style={styles.emptySteps}>
              <Ionicons name="git-network-outline" size={32} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>{t('workflow.noSteps')}</Text>
            </View>
          ) : (
            sortedSteps.map((step, idx) => {
              const isLast = idx === sortedSteps.length - 1;
              const stateConf = STATE_CONFIG[step.state ?? 'pending'] ?? STATE_CONFIG.pending;
              const typeIcon = STEP_TYPE_ICON[step.type ?? 'action'] ?? 'ellipse-outline';

              return (
                <View key={step.id ?? idx} style={styles.stepRow}>
                  {/* Timeline connector */}
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: stateConf.color },
                      ]}
                    >
                      <Ionicons name={stateConf.icon} size={16} color="#fff" />
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor:
                              step.state === 'completed'
                                ? theme.colors.success
                                : theme.colors.borderLight,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Step content */}
                  <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
                    <View style={styles.stepHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepName}>{step.name}</Text>
                        {step.description && (
                          <Text style={styles.stepDesc}>{step.description}</Text>
                        )}
                      </View>
                      <Badge
                        variant={stateConf.variant}
                        label={t(`workflow.states.${step.state ?? 'pending'}`, step.state ?? 'pending')}
                        size="sm"
                      />
                    </View>

                    <View style={styles.stepMeta}>
                      {step.type && (
                        <View style={styles.metaChip}>
                          <Ionicons name={typeIcon} size={12} color={theme.colors.textMuted} />
                          <Text style={styles.metaText}>
                            {t(`workflow.types.${step.type}`, step.type)}
                          </Text>
                        </View>
                      )}
                      {step.assignee && (
                        <View style={styles.metaChip}>
                          <Ionicons name="person-outline" size={12} color={theme.colors.textMuted} />
                          <Text style={styles.metaText}>{step.assignee}</Text>
                        </View>
                      )}
                      {step.order != null && (
                        <View style={styles.metaChip}>
                          <Ionicons name="list-outline" size={12} color={theme.colors.textMuted} />
                          <Text style={styles.metaText}>#{step.order}</Text>
                        </View>
                      )}
                    </View>

                    {step.nextSteps && step.nextSteps.length > 0 && (
                      <View style={styles.nextSteps}>
                        <Ionicons name={isAr ? 'arrow-back-outline' : 'arrow-forward-outline'} size={12} color={theme.colors.textMuted} />
                        <Text style={styles.nextStepText}>
                          {t('workflow.nextSteps')}: {step.nextSteps.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </CardBody>
      </Card>

      {/* Legend */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('workflow.legend')}</Text>
          <View style={styles.legendGrid}>
            {Object.entries(STATE_CONFIG).map(([state, conf]) => (
              <View key={state} style={styles.legendItem}>
                <Ionicons name={conf.icon} size={16} color={conf.color} />
                <Text style={styles.legendText}>
                  {t(`workflow.states.${state}`, state)}
                </Text>
              </View>
            ))}
          </View>
        </CardBody>
      </Card>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    domain: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },

    /* Progress */
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 16,
    },
    progressInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    progressLabel: { fontSize: 14, color: theme.colors.textSecondary },
    progressValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
    progressDetail: { fontSize: 12, color: theme.colors.textMuted },
    progressBg: {
      height: 8,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 4,
      marginTop: 8,
    },
    progressFill: {
      height: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 16,
    },

    /* Timeline */
    stepRow: { flexDirection: 'row' },
    timelineCol: { width: 36, alignItems: 'center' },
    timelineDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineLine: {
      width: 3,
      flex: 1,
      marginVertical: 2,
      borderRadius: 2,
    },
    stepContent: {
      flex: 1,
      paddingBottom: 20,
      paddingStart: 10,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    stepName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    stepDesc: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
      lineHeight: 18,
    },
    stepMeta: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: theme.colors.borderLight,
    },
    metaText: { fontSize: 11, color: theme.colors.textMuted },
    nextSteps: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    nextStepText: { fontSize: 11, color: theme.colors.textMuted },

    /* Empty */
    emptySteps: { alignItems: 'center', padding: 24 },
    emptyText: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8 },

    /* Legend */
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12, color: theme.colors.textSecondary },
  });
