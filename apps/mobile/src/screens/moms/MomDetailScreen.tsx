import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { Mom } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

const STATUS_COLORS: Record<string, string> = {
  present: '#10b981',
  absent: '#ef4444',
  excused: '#f59e0b',
  late: '#3b82f6',
};

const STATUS_ICONS: Record<string, string> = {
  present: 'checkmark-circle',
  absent: 'close-circle',
  excused: 'alert-circle',
  late: 'time',
};

export function MomDetailScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mom', id],
    queryFn: () => api.get<Mom>(`/api/v1/moms/${id}`),
  });

  const { data: workflow } = useQuery({
    queryKey: ['mom-workflow', id],
    queryFn: () => api.get<any>(`/api/v1/moms/${id}/workflow`),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/moms/${id}/submit`),
    onSuccess: () => { void refetch(); },
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/moms/${id}/approve`),
    onSuccess: () => { void refetch(); },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/api/v1/moms/${id}/reject`, { reason }),
    onSuccess: () => { void refetch(); },
  });

  const exportMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/moms/${id}/export`),
  });

  function confirmReject() {
    Alert.prompt?.(
      t('moms.reject'),
      t('moms.rejectReason'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('moms.reject'), style: 'destructive', onPress: (reason?: string) => rejectMutation.mutate(reason ?? '') },
      ],
      'plain-text'
    ) ?? Alert.alert(
      t('moms.reject'),
      t('moms.rejectReason'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('moms.reject'), style: 'destructive', onPress: () => rejectMutation.mutate('') },
      ]
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const statusVariant = data.status === 'approved' ? 'success' : data.status === 'pending_approval' ? 'warning' : 'info';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{isAr ? data.meetingTitleAr : data.meetingTitleEn}</Text>
          <Badge variant={statusVariant} label={String(t(`moms.statuses.${data.status}`, data.status))} />
        </CardBody>
      </Card>

      {/* Attendance */}
      {(data.attendance?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{String(t('moms.attendance'))}</Text>
          {data.attendance!.map((att: any, idx: number) => {
            const status = att.attendanceStatus ?? (att.isPresent ? 'present' : 'absent');
            return (
              <View key={idx} style={styles.attendeeRow}>
                <Ionicons
                  name={(STATUS_ICONS[status] ?? 'ellipse') as any}
                  size={18}
                  color={STATUS_COLORS[status] ?? theme.colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attendeeName}>{att.displayName}</Text>
                  <Text style={styles.attendeeEmail}>{att.email}</Text>
                </View>
                <Text style={[styles.statusLabel, { color: STATUS_COLORS[status] ?? theme.colors.textMuted }]}>
                  {String(t(`moms.attendanceStatuses.${status}`, status))}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Decisions */}
      {(data.decisions?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{String(t('moms.decisions'))}</Text>
          {data.decisions!.map((d: any) => (
            <Card key={d.id} style={{ marginTop: 6 }}>
              <CardBody>
                <Text style={styles.decisionText}>{isAr ? d.titleAr ?? d.textAr : d.titleEn ?? d.textEn}</Text>
              </CardBody>
            </Card>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {((data as any).recommendations?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{String(t('moms.recommendations'))}</Text>
          {(data as any).recommendations.map((r: any) => (
            <Card key={r.id} style={{ marginTop: 6 }}>
              <CardBody>
                <Text style={styles.recTitle}>{isAr ? r.titleAr : r.titleEn}</Text>
                <View style={styles.recMeta}>
                  {r.assignedToDisplayName && (
                    <View style={styles.recRow}>
                      <Ionicons name="person" size={13} color={theme.colors.textMuted} />
                      <Text style={styles.recMetaText}>{r.assignedToDisplayName}</Text>
                    </View>
                  )}
                  {r.dueDateUtc && (
                    <View style={styles.recRow}>
                      <Ionicons name="calendar" size={13} color={theme.colors.textMuted} />
                      <Text style={styles.recMetaText}>{new Date(r.dueDateUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</Text>
                    </View>
                  )}
                  <Badge variant={r.priority === 'High' ? 'danger' : r.priority === 'Low' ? 'success' : 'warning'} label={r.priority} />
                </View>
              </CardBody>
            </Card>
          ))}
        </View>
      )}

      {/* Workflow history */}
      {workflow?.hasWorkflow && workflow.history?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{String(t('moms.workflowHistory', 'Workflow History'))}</Text>
          {workflow.history.map((h: any, idx: number) => (
            <View key={idx} style={styles.historyRow}>
              <Ionicons name={isAr ? 'arrow-back-circle' : 'arrow-forward-circle'} size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyAction}>{h.action}: {h.fromState} → {h.toState}</Text>
                <Text style={styles.historyMeta}>
                  {h.actorDisplayName} · {new Date(h.occurredAtUtc).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {data.status === 'draft' && (
          <Button onPress={() => submitMutation.mutate()} loading={submitMutation.isPending} style={{ flex: 1 }}>
            {String(t('moms.submit'))}
          </Button>
        )}
        {data.status === 'pending_approval' && (
          <>
            <Button onPress={() => approveMutation.mutate()} loading={approveMutation.isPending} style={{ flex: 1 }}>
              {String(t('moms.approve'))}
            </Button>
            <Button variant="secondary" onPress={confirmReject} loading={rejectMutation.isPending} style={{ flex: 1 }}>
              {String(t('moms.reject'))}
            </Button>
          </>
        )}
        {data.status === 'approved' && (
          <Button variant="secondary" onPress={() => exportMutation.mutate()} loading={exportMutation.isPending} style={{ flex: 1 }}>
            {String(t('moms.export'))}
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  attendeeName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  attendeeEmail: { fontSize: 12, color: theme.colors.textMuted },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  decisionText: { fontSize: 14, color: theme.colors.text },
  recTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recMetaText: { fontSize: 12, color: theme.colors.textMuted },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 },
  historyAction: { fontSize: 13, fontWeight: '500', color: theme.colors.text },
  historyMeta: { fontSize: 11, color: theme.colors.textMuted },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
