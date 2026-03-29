import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, Badge, LoadingSpinner, EmptyState } from '../../components/ui';

/* ---- Types ---- */

interface SharedEntity {
  entityType: 'meeting' | 'committee' | 'survey';
  entityId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: string;
  startDateTimeUtc?: string;
  endDateTimeUtc?: string;
  locationAr?: string;
  locationEn?: string;
  onlineLink?: string;
  type?: string;
  memberCount?: number;
  allowCheckIn: boolean;
}

/* ---- Helpers ---- */

function entityIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'meeting': return 'calendar';
    case 'committee': return 'people';
    case 'survey': return 'clipboard';
    default: return 'document';
  }
}

function statusVariant(status: string) {
  switch (status) {
    case 'active': case 'in_progress': case 'scheduled': return 'success' as const;
    case 'completed': case 'closed': return 'default' as const;
    case 'draft': return 'warning' as const;
    case 'cancelled': return 'danger' as const;
    default: return 'info' as const;
  }
}

/* ---- Component ---- */

export function PublicShareScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { token } = route.params as { token: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-share', token],
    queryFn: () => api.get<SharedEntity>(`/api/v1/public/share/${token}`),
  });

  const checkInMut = useMutation({
    mutationFn: () => api.post(`/api/v1/public/share/${token}/check-in`),
    onSuccess: () => {
      Alert.alert(t('publicShare.checkInSuccess'), t('publicShare.checkInSuccessDesc'));
    },
    onError: () => {
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    },
  });

  const handleCheckIn = () => {
    Alert.alert(
      t('publicShare.checkIn'),
      t('publicShare.checkInConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('publicShare.checkIn'), onPress: () => checkInMut.mutate() },
      ],
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), t('publicShare.cannotOpenLink'));
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <EmptyState
          icon="link-outline"
          title={t('publicShare.linkInvalid')}
          message={t('publicShare.linkExpiredOrInvalid')}
          actionLabel={t('common.goBack')}
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const title = isAr ? data.titleAr : data.titleEn;
  const description = isAr ? data.descriptionAr : data.descriptionEn;
  const location = isAr ? data.locationAr : data.locationEn;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Entity Header Card */}
      <Card>
        <CardBody>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={entityIcon(data.entityType)} size={28} color={theme.colors.primary} />
            </View>
            <Badge
              variant="brand"
              label={t(`publicShare.entityTypes.${data.entityType}`, data.entityType)}
            />
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.badgeRow}>
            <Badge variant={statusVariant(data.status)} label={t(`publicShare.statuses.${data.status}`, data.status)} size="sm" />
            {data.type && (
              <Badge variant="info" label={t(`publicShare.types.${data.type}`, data.type)} size="sm" />
            )}
          </View>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </CardBody>
      </Card>

      {/* Details Card */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>{t('publicShare.details')}</Text>

          {data.startDateTimeUtc && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('publicShare.dateTime')}</Text>
                <Text style={styles.detailValue}>
                  {new Date(data.startDateTimeUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.detailValueSecondary}>
                  {new Date(data.startDateTimeUtc).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {data.endDateTimeUtc && (
                    ` — ${new Date(data.endDateTimeUtc).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  )}
                </Text>
              </View>
            </View>
          )}

          {location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('publicShare.location')}</Text>
                <Text style={styles.detailValue}>{location}</Text>
              </View>
            </View>
          )}

          {data.onlineLink && (
            <View style={styles.detailRow}>
              <Ionicons name="videocam-outline" size={18} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('publicShare.onlineLink')}</Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.primary }]}
                  onPress={() => handleOpenLink(data.onlineLink!)}
                >
                  {t('publicShare.joinOnline')}
                </Text>
              </View>
            </View>
          )}

          {data.memberCount != null && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={18} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('publicShare.members')}</Text>
                <Text style={styles.detailValue}>{data.memberCount}</Text>
              </View>
            </View>
          )}
        </CardBody>
      </Card>

      {/* Check-In Button (for meetings) */}
      {data.allowCheckIn && data.entityType === 'meeting' && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <View style={styles.checkInContainer}>
              <Ionicons name="finger-print" size={40} color={theme.colors.primary} />
              <Text style={styles.checkInTitle}>{t('publicShare.checkInAvailable')}</Text>
              <Text style={styles.checkInDesc}>{t('publicShare.checkInDesc')}</Text>
              <Button
                variant="primary"
                onPress={handleCheckIn}
                loading={checkInMut.isPending}
                icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
                style={{ marginTop: 16 }}
                size="lg"
              >
                {t('publicShare.checkIn')}
              </Button>
            </View>
          </CardBody>
        </Card>
      )}

      {/* Shared Info Notice */}
      <View style={styles.noticeBanner}>
        <Ionicons name="information-circle" size={18} color={theme.colors.info} />
        <Text style={styles.noticeText}>{t('publicShare.readOnlyNotice')}</Text>
      </View>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  description: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 21 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  detailValueSecondary: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },

  checkInContainer: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  checkInTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginTop: 8 },
  checkInDesc: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },

  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: theme.radius.sm,
  },
  noticeText: { fontSize: 13, fontWeight: '500', color: '#1d4ed8', flex: 1 },
});
