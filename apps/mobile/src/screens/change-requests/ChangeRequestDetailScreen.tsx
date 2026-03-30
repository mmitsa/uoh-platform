import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { ChangeRequest } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

function parseChanges(json?: string): Array<{ field: string; from: string; to: string }> {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function ChangeRequestDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['change-request', id],
    queryFn: () => api.get<ChangeRequest>(`/api/v1/change-requests/${id}`),
  });

  const approveMut = useMutation({
    mutationFn: () => api.post(`/api/v1/change-requests/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-request', id] });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      Alert.alert(t('common.success'), t('changeRequests.approvedSuccess'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const rejectMut = useMutation({
    mutationFn: () => api.post(`/api/v1/change-requests/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-request', id] });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      Alert.alert(t('common.success'), t('changeRequests.rejectedSuccess'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleApprove = () => {
    Alert.alert(t('changeRequests.approve'), t('changeRequests.approveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('changeRequests.approve'), onPress: () => approveMut.mutate() },
    ]);
  };

  const handleReject = () => {
    Alert.alert(t('changeRequests.reject'), t('changeRequests.rejectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('changeRequests.reject'),
        style: 'destructive',
        onPress: () => rejectMut.mutate(),
      },
    ]);
  };

  if (isLoading || !data) return <LoadingSpinner />;

  const changes = parseChanges(data.changesJson);
  const isPending = data.status === 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <View style={styles.headerRow}>
            <Ionicons
              name={
                data.status === 'approved'
                  ? 'checkmark-circle'
                  : data.status === 'rejected'
                    ? 'close-circle'
                    : 'time'
              }
              size={28}
              color={
                data.status === 'approved'
                  ? theme.colors.success
                  : data.status === 'rejected'
                    ? theme.colors.danger
                    : theme.colors.warning
              }
            />
            <Badge
              variant={STATUS_VARIANT[data.status] ?? 'default'}
              label={t(`changeRequests.statuses.${data.status}`, data.status)}
            />
          </View>

          <Text style={styles.label}>{t('changeRequests.committee')}</Text>
          <Text style={styles.value}>
            {isAr ? data.committeeNameAr : data.committeeNameEn}
          </Text>

          <Text style={styles.label}>{t('changeRequests.requester')}</Text>
          <Text style={styles.value}>{data.requesterDisplayName}</Text>

          <Text style={styles.label}>{t('changeRequests.reason')}</Text>
          <Text style={styles.descriptionText}>
            {isAr ? data.reasonAr : data.reasonEn}
          </Text>

          <Text style={styles.label}>{t('changeRequests.createdAt')}</Text>
          <Text style={styles.value}>
            {new Date(data.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </CardBody>
      </Card>

      {/* Changes Detail */}
      {changes.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('changeRequests.proposedChanges')}</Text>
            {changes.map((change, idx) => (
              <View key={idx} style={styles.changeItem}>
                <Text style={styles.changeField}>{change.field}</Text>
                <View style={styles.changeValues}>
                  <View style={styles.changeFrom}>
                    <Text style={styles.changeLabel}>{t('changeRequests.from')}</Text>
                    <Text style={styles.changeValue}>{change.from || '—'}</Text>
                  </View>
                  <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={16} color={theme.colors.textMuted} />
                  <View style={styles.changeTo}>
                    <Text style={styles.changeLabel}>{t('changeRequests.to')}</Text>
                    <Text style={[styles.changeValue, { color: theme.colors.primary }]}>
                      {change.to || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Review notes (if already reviewed) */}
      {data.reviewerDisplayName && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('changeRequests.review')}</Text>
            <Text style={styles.label}>{t('changeRequests.reviewer')}</Text>
            <Text style={styles.value}>{data.reviewerDisplayName}</Text>
            {(data.reviewNotesAr || data.reviewNotesEn) && (
              <>
                <Text style={styles.label}>{t('changeRequests.reviewNotes')}</Text>
                <Text style={styles.descriptionText}>
                  {isAr ? data.reviewNotesAr : data.reviewNotesEn}
                </Text>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Actions for admins (only show if pending) */}
      {isPending && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleApprove}
            loading={approveMut.isPending}
            icon={<Ionicons name="checkmark" size={18} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('changeRequests.approve')}
          </Button>
          <Button
            variant="danger"
            onPress={handleReject}
            loading={rejectMut.isPending}
            icon={<Ionicons name="close" size={18} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('changeRequests.reject')}
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 16,
      textTransform: 'uppercase',
    },
    value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
    descriptionText: {
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

    /* Changes */
    changeItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    changeField: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    changeValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    changeFrom: { flex: 1 },
    changeTo: { flex: 1 },
    changeLabel: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'uppercase' },
    changeValue: { fontSize: 14, color: theme.colors.text, marginTop: 2 },

    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  });
