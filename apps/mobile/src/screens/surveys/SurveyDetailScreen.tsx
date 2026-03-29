import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

/* ---- Types ---- */

interface SurveyQuestion {
  id: string;
  order: number;
  type: string;
  textAr: string;
  textEn: string;
  optionsJson: string | null;
}

interface SurveyDetail {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  type: string;
  targetAudience: string;
  status: string;
  startAtUtc: string;
  endAtUtc: string;
  committeeId: string | null;
  recommendationTaskId: string | null;
  totalResponses: number;
  questions: SurveyQuestion[];
}

/* ---- Helpers ---- */

const statusVariant = (s: string) => {
  switch (s) {
    case 'active': return 'success' as const;
    case 'closed': return 'default' as const;
    case 'draft': return 'warning' as const;
    default: return 'info' as const;
  }
};

function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

/* ---- Component ---- */

export function SurveyDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get<SurveyDetail>(`/api/v1/surveys/${id}`),
  });

  const activateMut = useMutation({
    mutationFn: () => api.post(`/api/v1/surveys/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['survey', id] }); qc.invalidateQueries({ queryKey: ['surveys'] }); },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const closeMut = useMutation({
    mutationFn: () => api.post(`/api/v1/surveys/${id}/close`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['survey', id] }); qc.invalidateQueries({ queryKey: ['surveys'] }); },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleActivate = () => {
    Alert.alert(
      t('surveys.activate'),
      t('surveys.activateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('surveys.activate'), onPress: () => activateMut.mutate() },
      ],
    );
  };

  const handleClose = () => {
    Alert.alert(
      t('surveys.closeSurvey'),
      t('surveys.closeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('surveys.closeSurvey'), style: 'destructive', onPress: () => closeMut.mutate() },
      ],
    );
  };

  const handleShare = async () => {
    if (!data) return;
    const title = isAr ? data.titleAr : data.titleEn;
    await Share.share({ message: `${title}\n${t('surveys.responses')}: ${data.totalResponses}` });
  };

  if (isLoading || !data) return <LoadingSpinner />;

  const title = isAr ? data.titleAr : data.titleEn;
  const description = isAr ? data.descriptionAr : data.descriptionEn;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header Card */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.badgeRow}>
            <Badge variant={statusVariant(data.status)} label={t(`surveys.statuses.${data.status}`, data.status)} />
            <Badge variant="brand" label={t(`surveys.types.${data.type}`, data.type)} />
            {data.committeeId && (
              <Badge variant="info" label={t('surveys.fromCommittee')} size="sm" />
            )}
          </View>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* Details */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.detailText}>
              {new Date(data.startAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              {' — '}
              {new Date(data.endAtUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.detailText}>
              {t(`surveys.audiences.${data.targetAudience}`, data.targetAudience)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.detailText}>
              {t('surveys.responses')}: {data.totalResponses}
            </Text>
          </View>
        </CardBody>
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.questions?.length ?? 0}</Text>
          <Text style={styles.statLabel}>{t('surveys.questionsCount')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.totalResponses}</Text>
          <Text style={styles.statLabel}>{t('surveys.responses')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: data.status === 'active' ? theme.colors.success : theme.colors.textMuted }]}>
            {data.status === 'active' ? '●' : '○'}
          </Text>
          <Text style={styles.statLabel}>{t(`surveys.statuses.${data.status}`, data.status)}</Text>
        </View>
      </View>

      {/* Questions Section */}
      {data.questions && data.questions.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('surveys.questions')}</Text>
            {data.questions
              .sort((a, b) => a.order - b.order)
              .map((q) => {
                const qText = isAr ? q.textAr : q.textEn;
                const options = parseOptions(q.optionsJson);
                const isExpanded = expandedQ === q.id;

                return (
                  <Pressable
                    key={q.id}
                    onPress={() => setExpandedQ(isExpanded ? null : q.id)}
                    style={styles.questionItem}
                  >
                    <View style={styles.questionHeader}>
                      <View style={styles.questionOrderBadge}>
                        <Text style={styles.questionOrderText}>{q.order}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.questionText}>{qText}</Text>
                        <Text style={styles.questionType}>
                          {t(`surveys.questionTypes.${q.type}`, q.type)}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </View>

                    {isExpanded && options.length > 0 && (
                      <View style={styles.optionsList}>
                        {options.map((opt, idx) => (
                          <View key={idx} style={styles.optionItem}>
                            <View style={styles.optionBullet} />
                            <Text style={styles.optionText}>{opt}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {data.status === 'draft' && (
          <Button
            variant="primary"
            onPress={handleActivate}
            loading={activateMut.isPending}
            icon={<Ionicons name="play" size={16} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('surveys.activate')}
          </Button>
        )}

        {data.status === 'active' && (
          <Button
            variant="primary"
            onPress={() => navigation.navigate('SurveyResponse', { id })}
            icon={<Ionicons name="create-outline" size={16} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('surveys.respond')}
          </Button>
        )}

        {data.status === 'active' && (
          <Button
            variant="danger"
            onPress={handleClose}
            loading={closeMut.isPending}
            icon={<Ionicons name="stop" size={16} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('surveys.closeSurvey')}
          </Button>
        )}

        <Button
          variant="secondary"
          onPress={handleShare}
          icon={<Ionicons name="share-outline" size={16} color={theme.colors.primary} />}
          style={{ flex: 1 }}
        >
          {t('common.share')}
        </Button>
      </View>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  description: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  detailText: { fontSize: 14, color: theme.colors.textSecondary, flex: 1 },

  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  questionItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: 12,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questionOrderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionOrderText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  questionText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  questionType: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },

  optionsList: { marginTop: 10, marginStart: 38, gap: 6 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  optionText: { fontSize: 13, color: theme.colors.textSecondary },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
