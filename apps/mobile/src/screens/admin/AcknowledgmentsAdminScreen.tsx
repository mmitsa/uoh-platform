import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, DataList } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import type { AcknowledgmentTemplate, PagedResponse } from '../../api/types';

/* ---- Helpers ---- */

function statusVariant(status: string) {
  switch (status) {
    case 'published': return 'success' as const;
    case 'draft': return 'warning' as const;
    case 'archived': return 'default' as const;
    default: return 'info' as const;
  }
}

function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category.toLowerCase()) {
    case 'privacy': return 'lock-closed';
    case 'security': return 'shield';
    case 'compliance': return 'document-text';
    case 'terms': return 'newspaper';
    case 'policy': return 'briefcase';
    default: return 'document';
  }
}

/* ---- Component ---- */

export function AcknowledgmentsAdminScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-acknowledgments'],
    queryFn: () => api.get<PagedResponse<AcknowledgmentTemplate>>('/api/v1/acknowledgments'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  // Publish mutation
  const publishMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/acknowledgments/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-acknowledgments'] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  // Archive mutation
  const archiveMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/acknowledgments/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-acknowledgments'] });
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handlePublish = (item: AcknowledgmentTemplate) => {
    Alert.alert(
      t('admin.publishAcknowledgment'),
      t('admin.publishConfirm', { title: isAr ? item.titleAr : item.titleEn }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.publish'), onPress: () => publishMut.mutate(item.id) },
      ],
    );
  };

  const handleArchive = (item: AcknowledgmentTemplate) => {
    Alert.alert(
      t('admin.archiveAcknowledgment'),
      t('admin.archiveConfirm', { title: isAr ? item.titleAr : item.titleEn }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.archive'), style: 'destructive', onPress: () => archiveMut.mutate(item.id) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.acknowledgmentsAdmin')}</Text>

      {/* Stats Summary */}
      {data && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data.items.length}</Text>
            <Text style={styles.statLabel}>{t('admin.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {data.items.filter(i => i.status === 'published').length}
            </Text>
            <Text style={styles.statLabel}>{t('admin.published')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {data.items.filter(i => i.isMandatory).length}
            </Text>
            <Text style={styles.statLabel}>{t('admin.mandatory')}</Text>
          </View>
        </View>
      )}

      <DataList
        data={data?.items}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('admin.noAcknowledgments')}
        keyExtractor={(item: AcknowledgmentTemplate) => item.id}
        renderItem={({ item }: { item: AcknowledgmentTemplate }) => (
          <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
            <CardBody>
              {/* Header */}
              <View style={styles.itemHeader}>
                <View style={[styles.categoryIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name={categoryIcon(item.category)} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {isAr ? item.titleAr : item.titleEn}
                  </Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgeRow}>
                <Badge variant={statusVariant(item.status)} label={t(`admin.ackStatuses.${item.status}`, item.status)} size="sm" />
                {item.isMandatory && (
                  <Badge variant="danger" label={t('admin.mandatory')} size="sm" />
                )}
                {item.requiresRenewal && (
                  <Badge
                    variant="warning"
                    label={`${t('admin.renewal')} ${item.renewalDays ? `(${item.renewalDays}d)` : ''}`}
                    size="sm"
                  />
                )}
              </View>

              {/* Body Preview */}
              <Text style={styles.bodyPreview} numberOfLines={2}>
                {isAr ? item.bodyAr : item.bodyEn}
              </Text>

              {/* Date */}
              <Text style={styles.dateText}>
                {t('admin.createdAt')}: {new Date(item.createdAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                {item.status === 'draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handlePublish(item)}
                    loading={publishMut.isPending}
                    icon={<Ionicons name="rocket" size={14} color="#fff" />}
                  >
                    {t('admin.publish')}
                  </Button>
                )}
                {item.status === 'published' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handleArchive(item)}
                    loading={archiveMut.isPending}
                    icon={<Ionicons name="archive" size={14} color={theme.colors.primary} />}
                  >
                    {t('admin.archive')}
                  </Button>
                )}
                {item.status === 'archived' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => handlePublish(item)}
                    loading={publishMut.isPending}
                    icon={<Ionicons name="refresh" size={14} color={theme.colors.primary} />}
                  >
                    {t('admin.republish')}
                  </Button>
                )}
              </View>
            </CardBody>
          </Card>
        )}
      />
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, padding: 16, paddingBottom: 8 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },

  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  itemCategory: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, textTransform: 'capitalize' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },

  bodyPreview: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 10, lineHeight: 20 },
  dateText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 8 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
