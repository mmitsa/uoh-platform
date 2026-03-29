import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { VoteSession } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

export function VotingDetailScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vote', id],
    queryFn: () => api.get<VoteSession>(`/api/v1/votes/${id}`),
  });

  const castVoteMut = useMutation({
    mutationFn: (optionId: string) => api.post(`/api/v1/votes/${id}/cast`, { optionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vote', id] });
      qc.invalidateQueries({ queryKey: ['votes'] });
      Alert.alert(t('common.success'), t('voting.voteSubmitted'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  function handleCastVote() {
    if (!selectedOptionId) return;
    Alert.alert(
      t('voting.castVote'),
      t('voting.confirmVote'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('voting.castVote'), onPress: () => castVoteMut.mutate(selectedOptionId) },
      ],
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const statusVariant = data.status === 'open' ? 'success' : data.status === 'closed' ? 'info' : 'default';
  const isOpen = data.status === 'open';
  const totalVotes = data.totalVotes ?? data.options?.reduce((s, o) => s + o.votesCount, 0) ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <Card>
        <CardBody>
          <Text style={styles.title}>{isAr ? data.titleAr : data.titleEn}</Text>
          {(isAr ? data.titleEn : data.titleAr) ? (
            <Text style={styles.subtitle}>{isAr ? data.titleEn : data.titleAr}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <Badge variant={statusVariant} label={t(`voting.statuses.${data.status}`, data.status)} />
          </View>
          {data.descriptionAr || data.descriptionEn ? (
            <Text style={styles.description}>{isAr ? data.descriptionAr : data.descriptionEn}</Text>
          ) : null}
        </CardBody>
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalVotes}</Text>
          <Text style={styles.statLabel}>{t('voting.totalVotes')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.options?.length ?? 0}</Text>
          <Text style={styles.statLabel}>{t('voting.optionCount')}</Text>
        </View>
      </View>

      {/* Vote Options / Results */}
      {data.options && data.options.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>
              {isOpen ? t('voting.castYourVote') : t('voting.results')}
            </Text>

            {data.options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
              const isSelected = selectedOptionId === option.id;
              const maxVotes = Math.max(...(data.options?.map(o => o.votesCount) ?? [0]));
              const isWinner = !isOpen && option.votesCount === maxVotes && maxVotes > 0;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => isOpen ? setSelectedOptionId(option.id) : undefined}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionSelected,
                    isWinner && styles.optionWinner,
                  ]}
                >
                  <View style={styles.optionHeader}>
                    {isOpen && (
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    )}
                    {!isOpen && isWinner && (
                      <Ionicons name="trophy" size={18} color="#f59e0b" style={{ marginEnd: 6 }} />
                    )}
                    <Text style={[styles.optionLabel, isSelected && { color: theme.colors.primary }]}>
                      {isAr ? option.labelAr : option.labelEn}
                    </Text>
                    <Text style={styles.voteCount}>{option.votesCount}</Text>
                  </View>

                  {!isOpen && (
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${percentage}%` }, isWinner && { backgroundColor: '#f59e0b' }]} />
                    </View>
                  )}
                  {!isOpen && (
                    <Text style={styles.percentage}>{percentage}%</Text>
                  )}
                </Pressable>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Cast Vote Button */}
      {isOpen && (
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleCastVote}
            loading={castVoteMut.isPending}
            disabled={!selectedOptionId}
            icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
            style={{ flex: 1 }}
          >
            {t('voting.castVote')}
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  description: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  optionItem: {
    borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm,
    padding: 14, marginBottom: 10,
  },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: '#eff6ff' },
  optionWinner: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  optionHeader: { flexDirection: 'row', alignItems: 'center' },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginEnd: 10,
  },
  radioSelected: { borderColor: theme.colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
  voteCount: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
  barBg: { height: 6, backgroundColor: theme.colors.borderLight, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  percentage: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, textAlign: 'right' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
