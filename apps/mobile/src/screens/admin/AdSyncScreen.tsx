import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, DataList, LoadingSpinner } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

/* ---- Types ---- */

interface AdSyncStatus {
  isConnected: boolean;
  lastSyncAtUtc: string | null;
  serverUrl: string;
  domain: string;
}

interface SyncHistoryItem {
  id: string;
  startedAtUtc: string;
  completedAtUtc: string | null;
  status: 'success' | 'failed' | 'running';
  totalProcessed: number;
  usersCreated: number;
  usersUpdated: number;
  errors: number;
  errorDetails?: string;
}

interface SyncHistoryResponse {
  items: SyncHistoryItem[];
  total: number;
}

/* ---- Helpers ---- */

function statusVariant(status: string) {
  switch (status) {
    case 'success': return 'success' as const;
    case 'failed': return 'danger' as const;
    case 'running': return 'warning' as const;
    default: return 'default' as const;
  }
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '-';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  return `${minutes}m ${remainSec}s`;
}

/* ---- Component ---- */

export function AdSyncScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  // Fetch connection status
  const { data: syncStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['ad-sync-status'],
    queryFn: () => api.get<AdSyncStatus>('/api/v1/admin/ad-sync/status'),
  });

  // Fetch sync history
  const { data: history, isLoading: historyLoading, refetch } = useQuery({
    queryKey: ['ad-sync-history'],
    queryFn: () => api.get<SyncHistoryResponse>('/api/v1/admin/ad-sync/history'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  // Manual sync mutation
  const syncMut = useMutation({
    mutationFn: () => api.post('/api/v1/admin/ad-sync/run'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-sync-history'] });
      qc.invalidateQueries({ queryKey: ['ad-sync-status'] });
      Alert.alert(t('common.success'), t('admin.syncStarted'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleSync = () => {
    Alert.alert(
      t('admin.runSync'),
      t('admin.runSyncConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.runSync'), onPress: () => syncMut.mutate() },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.title}>{t('admin.adSync')}</Text>

      {/* Connection Status Card */}
      <Card>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('admin.connectionStatus')}</Text>
          {statusLoading ? (
            <LoadingSpinner />
          ) : syncStatus ? (
            <>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: syncStatus.isConnected ? theme.colors.success : theme.colors.danger },
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: syncStatus.isConnected ? theme.colors.success : theme.colors.danger },
                ]}>
                  {syncStatus.isConnected ? t('admin.connected') : t('admin.disconnected')}
                </Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('admin.server')}</Text>
                  <Text style={styles.detailValue} selectable>{syncStatus.serverUrl}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('admin.domain')}</Text>
                  <Text style={styles.detailValue} selectable>{syncStatus.domain}</Text>
                </View>
                {syncStatus.lastSyncAtUtc && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('admin.lastSync')}</Text>
                    <Text style={styles.detailValue}>
                      {new Date(syncStatus.lastSyncAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.noData}>{t('admin.statusUnavailable')}</Text>
          )}
        </CardBody>
      </Card>

      {/* Manual Sync Button */}
      <Button
        variant="primary"
        onPress={handleSync}
        loading={syncMut.isPending}
        icon={<Ionicons name="sync" size={18} color="#fff" />}
        style={{ marginTop: 16 }}
        size="lg"
      >
        {t('admin.runManualSync')}
      </Button>

      {/* Sync History */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
        {t('admin.syncHistory')}
      </Text>

      {historyLoading ? (
        <LoadingSpinner />
      ) : (
        (history?.items ?? []).map((item) => (
          <Card key={item.id} style={{ marginBottom: 10 }}>
            <CardBody>
              {/* History Header */}
              <View style={styles.historyHeader}>
                <Ionicons
                  name={item.status === 'success' ? 'checkmark-circle' : item.status === 'failed' ? 'close-circle' : 'hourglass'}
                  size={22}
                  color={item.status === 'success' ? theme.colors.success : item.status === 'failed' ? theme.colors.danger : theme.colors.warning}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>
                    {new Date(item.startedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.historyDuration}>
                    {t('admin.duration')}: {formatDuration(item.startedAtUtc, item.completedAtUtc)}
                  </Text>
                </View>
                <Badge
                  variant={statusVariant(item.status)}
                  label={t(`admin.syncStatuses.${item.status}`, item.status)}
                  size="sm"
                />
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{item.totalProcessed}</Text>
                  <Text style={styles.statLabel}>{t('admin.total')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>{item.usersCreated}</Text>
                  <Text style={styles.statLabel}>{t('admin.created')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.info }]}>{item.usersUpdated}</Text>
                  <Text style={styles.statLabel}>{t('admin.updated')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: item.errors > 0 ? theme.colors.danger : theme.colors.textMuted }]}>
                    {item.errors}
                  </Text>
                  <Text style={styles.statLabel}>{t('admin.errors')}</Text>
                </View>
              </View>

              {/* Error Details */}
              {item.errorDetails && (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={14} color={theme.colors.danger} />
                  <Text style={styles.errorText} numberOfLines={3}>{item.errorDetails}</Text>
                </View>
              )}
            </CardBody>
          </Card>
        ))
      )}

      {!historyLoading && (!history?.items || history.items.length === 0) && (
        <Card>
          <CardBody>
            <View style={styles.emptyHistory}>
              <Ionicons name="time-outline" size={40} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>{t('admin.noSyncHistory')}</Text>
            </View>
          </CardBody>
        </Card>
      )}
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  statusText: { fontSize: 16, fontWeight: '700' },

  detailsGrid: { gap: 12 },
  detailItem: {},
  detailLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '500', color: theme.colors.text },

  noData: { fontSize: 14, color: theme.colors.textMuted, fontStyle: 'italic' },

  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyDate: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  historyDuration: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },

  statsGrid: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xs,
  },
  statNumber: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2, textTransform: 'uppercase' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: theme.radius.xs,
  },
  errorText: { fontSize: 12, color: '#b91c1c', flex: 1 },

  emptyHistory: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: theme.colors.textMuted },
});
