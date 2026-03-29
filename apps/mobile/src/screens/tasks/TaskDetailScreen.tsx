import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { TaskItem } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['in_progress'],
  in_progress: ['completed', 'pending'],
  overdue: ['in_progress', 'completed'],
  completed: [],
  cancelled: [],
};

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  pending: 'default', in_progress: 'info', completed: 'success', overdue: 'danger', cancelled: 'default',
};

export function TaskDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [localProgress, setLocalProgress] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.get<TaskItem>(`/api/v1/tasks/${id}`),
  });

  const updateProgressMut = useMutation({
    mutationFn: (progress: number) => api.put(`/api/v1/tasks/${id}`, { progressPercent: progress }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setLocalProgress(null);
      Alert.alert(t('common.success'), t('tasks.progressUpdated'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const updateStatusMut = useMutation({
    mutationFn: (status: string) => api.put(`/api/v1/tasks/${id}`, { status }),
    onSuccess: () => {
      void refetch();
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  function confirmStatusChange(newStatus: string) {
    Alert.alert(
      t('tasks.changeStatus'),
      t('tasks.confirmStatusChange', { status: t(`tasks.statuses.${newStatus}`, newStatus) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('actions.confirm'), onPress: () => updateStatusMut.mutate(newStatus) },
      ],
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const currentProgress = localProgress ?? data.progressPercent ?? 0;
  const nextStatuses = STATUS_FLOW[data.status] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardBody>
          <Text style={styles.name}>{isAr ? data.titleAr : data.titleEn}</Text>
          {(isAr ? data.titleEn : data.titleAr) ? (
            <Text style={styles.subtitle}>{isAr ? data.titleEn : data.titleAr}</Text>
          ) : null}
          <View style={styles.row}>
            <Badge variant={data.priority === 'critical' ? 'danger' : data.priority === 'high' ? 'warning' : 'default'} label={t(`tasks.priorities.${data.priority}`, data.priority)} />
            <Badge variant={STATUS_VARIANT[data.status] ?? 'default'} label={t(`tasks.statuses.${data.status}`, data.status)} />
          </View>
          <Text style={styles.label}>{t('tasks.assignedTo')}</Text>
          <Text style={styles.value}>{data.assignedToDisplayName ?? '—'}</Text>
          <Text style={styles.label}>{t('tasks.dueDate')}</Text>
          <Text style={styles.value}>{new Date(data.dueDateUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</Text>
          {(data.descriptionAr || data.descriptionEn) && (
            <>
              <Text style={styles.label}>{t('tasks.description')}</Text>
              <Text style={styles.descriptionText}>{isAr ? data.descriptionAr : data.descriptionEn}</Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* Progress Update Section */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('tasks.updateProgress')}</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{t('tasks.progress')}</Text>
            <Text style={styles.progressValue}>{currentProgress}%</Text>
          </View>
          <View style={styles.progressSteps}>
            {[0, 25, 50, 75, 100].map((step) => (
              <Pressable key={step} onPress={() => setLocalProgress(step)}
                style={[styles.progressStep, currentProgress >= step && styles.progressStepActive]}>
                <Text style={[styles.progressStepText, currentProgress >= step && styles.progressStepTextActive]}>{step}%</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${currentProgress}%` }]} />
          </View>
          {localProgress !== null && localProgress !== (data.progressPercent ?? 0) && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => updateProgressMut.mutate(localProgress)}
              loading={updateProgressMut.isPending}
              style={{ marginTop: 12, alignSelf: 'flex-end' }}
            >
              {t('tasks.saveProgress')}
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Status Change Section */}
      {nextStatuses.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('tasks.changeStatus')}</Text>
            <View style={styles.statusButtons}>
              {nextStatuses.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => confirmStatusChange(status)}
                  style={[styles.statusButton, status === 'completed' && styles.statusButtonSuccess]}
                >
                  <Ionicons
                    name={status === 'completed' ? 'checkmark-circle' : status === 'in_progress' ? 'play-circle' : 'pause-circle'}
                    size={20}
                    color={status === 'completed' ? '#10b981' : theme.colors.primary}
                  />
                  <Text style={[styles.statusButtonText, status === 'completed' && { color: '#10b981' }]}>
                    {t(`tasks.statuses.${status}`, status)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => navigation.navigate('TaskForm', { id })} style={{ flex: 1 }}>
          {t('actions.edit')}
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, marginTop: 16, textTransform: 'uppercase' },
  value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
  descriptionText: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, color: theme.colors.textSecondary },
  progressValue: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  progressSteps: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  progressStep: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: theme.radius.sm,
    borderWidth: 1, borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surface,
  },
  progressStepActive: { borderColor: theme.colors.primary, backgroundColor: '#eff6ff' },
  progressStepText: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted },
  progressStepTextActive: { color: theme.colors.primary },
  progressBg: { height: 8, backgroundColor: theme.colors.borderLight, borderRadius: 4, marginTop: 4 },
  progressFill: { height: 8, backgroundColor: theme.colors.primary, borderRadius: 4 },

  statusButtons: { gap: 8 },
  statusButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm,
  },
  statusButtonSuccess: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  statusButtonText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
