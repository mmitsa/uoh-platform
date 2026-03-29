import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { AcknowledgmentTemplate, UserAcknowledgment } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

interface AcknowledgmentDetailData extends UserAcknowledgment {
  bodyAr?: string;
  bodyEn?: string;
}

export function AcknowledgmentDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['acknowledgment', id],
    queryFn: () => api.get<AcknowledgmentDetailData>(`/api/v1/acknowledgments/${id}`),
  });

  /* Optionally fetch the template for the body content */
  const { data: template } = useQuery({
    queryKey: ['acknowledgment-template', data?.templateId],
    queryFn: () =>
      api.get<AcknowledgmentTemplate>(`/api/v1/acknowledgment-templates/${data!.templateId}`),
    enabled: Boolean(data?.templateId && !data?.bodyAr && !data?.bodyEn),
  });

  const acknowledgeMut = useMutation({
    mutationFn: () => api.post(`/api/v1/acknowledgments/${id}/acknowledge`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acknowledgment', id] });
      qc.invalidateQueries({ queryKey: ['acknowledgments-pending'] });
      qc.invalidateQueries({ queryKey: ['acknowledgments-history'] });
      Alert.alert(t('common.success'), t('acknowledgments.acknowledgedSuccess'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleAcknowledge = () => {
    Alert.alert(
      t('acknowledgments.acknowledgeTitle'),
      t('acknowledgments.acknowledgeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('acknowledgments.acknowledge'),
          onPress: () => acknowledgeMut.mutate(),
        },
      ],
    );
  };

  if (isLoading || !data) return <LoadingSpinner />;

  const title = isAr ? data.titleAr : data.titleEn;
  const body = data.bodyAr || data.bodyEn
    ? isAr
      ? data.bodyAr
      : data.bodyEn
    : template
      ? isAr
        ? template.bodyAr
        : template.bodyEn
      : null;
  const acknowledged = Boolean(data.acknowledgedAtUtc);
  const expired = data.expiresAtUtc ? new Date(data.expiresAtUtc) < new Date() : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.badgeRow}>
            {acknowledged ? (
              <Badge variant="success" label={t('acknowledgments.acknowledged')} />
            ) : expired ? (
              <Badge variant="danger" label={t('acknowledgments.expired')} />
            ) : (
              <Badge variant="warning" label={t('acknowledgments.pendingLabel')} />
            )}
            <Badge
              variant={data.isMandatory ? 'danger' : 'default'}
              label={
                data.isMandatory
                  ? t('acknowledgments.mandatory')
                  : t('acknowledgments.optional')
              }
            />
          </View>

          <Text style={styles.label}>{t('acknowledgments.category')}</Text>
          <Text style={styles.value}>{data.category}</Text>

          {data.acknowledgedAtUtc && (
            <>
              <Text style={styles.label}>{t('acknowledgments.acknowledgedOn')}</Text>
              <Text style={styles.value}>
                {new Date(data.acknowledgedAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>
            </>
          )}

          {data.expiresAtUtc && (
            <>
              <Text style={styles.label}>{t('acknowledgments.expiresOn')}</Text>
              <Text style={[styles.value, expired && { color: theme.colors.danger }]}>
                {new Date(data.expiresAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* Document Body */}
      {body && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('acknowledgments.documentBody')}</Text>
            <Text style={styles.bodyText}>{body}</Text>
          </CardBody>
        </Card>
      )}

      {/* Status Indicator */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <View style={styles.statusRow}>
            <Ionicons
              name={acknowledged ? 'checkmark-circle' : 'time-outline'}
              size={32}
              color={acknowledged ? theme.colors.success : theme.colors.warning}
            />
            <View style={{ flex: 1, marginStart: 12 }}>
              <Text style={styles.statusText}>
                {acknowledged
                  ? t('acknowledgments.alreadyAcknowledged')
                  : t('acknowledgments.needsAcknowledgment')}
              </Text>
              <Text style={styles.statusHint}>
                {acknowledged
                  ? t('acknowledgments.thankYou')
                  : t('acknowledgments.readAndAcknowledge')}
              </Text>
            </View>
          </View>
        </CardBody>
      </Card>

      {/* Action */}
      {!acknowledged && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleAcknowledge}
            loading={acknowledgeMut.isPending}
            icon={<Ionicons name="checkmark" size={18} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('acknowledgments.acknowledge')}
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 16,
      textTransform: 'uppercase',
    },
    value: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    bodyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    statusHint: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  });
