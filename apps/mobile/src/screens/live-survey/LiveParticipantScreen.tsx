import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, Badge, LoadingSpinner, EmptyState } from '../../components/ui';
import { useSignalR } from '../../hooks/useSignalR';
import { getHub } from '../../services/signalr';
import type { LiveSessionPublic } from '../../api/types';

/* ---- Types ---- */

interface QuestionPayload {
  questionId: string;
  questionIndex: number;
  textAr: string;
  textEn: string;
  type: string;
  optionsJson: string | null;
}

/* ---- Helpers ---- */

function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

/* ---- Component ---- */

export function LiveParticipantScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { joinCode } = route.params as { joinCode: string };

  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [acceptingVotes, setAcceptingVotes] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch session info
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['live-session', joinCode],
    queryFn: () => api.get<LiveSessionPublic>(`/api/v1/live-sessions/join/${joinCode}`),
  });

  const handlers = useMemo(() => ({
    QuestionChanged: (data: QuestionPayload) => {
      setCurrentQuestion(data);
      setSelectedOptions([]);
      setHasVoted(false);
    },
    VotingStateChanged: (data: { acceptingVotes: boolean }) => {
      setAcceptingVotes(data.acceptingVotes);
    },
    VoteRecorded: () => {
      setHasVoted(true);
      setSubmitting(false);
    },
    SessionEnded: () => {
      setSessionEnded(true);
    },
  }), []);

  const connectionRef = useSignalR('live-survey', handlers);

  // Join as participant once connected and session loaded
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      const hub = getHub('live-survey');
      if (hub) {
        hub.invoke('JoinAsParticipant', joinCode).catch((err: Error) => {
          Alert.alert(t('common.error'), err.message);
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [session, joinCode, t]);

  const handleSelectOption = useCallback((index: number) => {
    if (hasVoted || !acceptingVotes) return;

    const questionType = currentQuestion?.type ?? 'single_choice';
    if (questionType === 'multiple_choice' || questionType === 'checkbox') {
      setSelectedOptions(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index],
      );
    } else {
      setSelectedOptions([index]);
    }
  }, [hasVoted, acceptingVotes, currentQuestion]);

  const handleSubmitVote = useCallback(() => {
    if (selectedOptions.length === 0) {
      Alert.alert(t('common.error'), t('liveSurvey.selectOption'));
      return;
    }

    const hub = getHub('live-survey');
    if (!hub || !currentQuestion) return;

    setSubmitting(true);
    hub.invoke('SubmitVote', joinCode, currentQuestion.questionId, selectedOptions).catch((err: Error) => {
      setSubmitting(false);
      Alert.alert(t('common.error'), err.message);
    });
  }, [selectedOptions, joinCode, currentQuestion, t]);

  if (sessionLoading) return <LoadingSpinner />;

  if (sessionError || !session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <EmptyState
          icon="alert-circle-outline"
          title={t('liveSurvey.sessionNotFound')}
          message={t('liveSurvey.sessionNotFoundDesc')}
          actionLabel={t('common.goBack')}
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (sessionEnded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
        <Text style={styles.endedTitle}>{t('liveSurvey.sessionEnded')}</Text>
        <Text style={styles.endedSubtitle}>{t('liveSurvey.thankYou')}</Text>
        <Button variant="primary" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  const options = currentQuestion ? parseOptions(currentQuestion.optionsJson) : [];
  const isMultiple = currentQuestion?.type === 'multiple_choice' || currentQuestion?.type === 'checkbox';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Session Header */}
      <Card>
        <CardBody>
          <Text style={styles.sessionTitle}>
            {isAr ? session.surveyTitleAr : session.surveyTitleEn}
          </Text>
          <View style={styles.statusRow}>
            <Badge
              variant={session.status === 'active' ? 'success' : 'warning'}
              label={t(`liveSurvey.statuses.${session.status}`, session.status)}
              size="sm"
            />
            <Badge
              variant={acceptingVotes ? 'success' : 'default'}
              label={acceptingVotes ? t('liveSurvey.votingOpen') : t('liveSurvey.votingClosed')}
              size="sm"
            />
          </View>
        </CardBody>
      </Card>

      {/* Waiting / Current Question */}
      {!currentQuestion ? (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <View style={styles.waitingContainer}>
              <Ionicons name="hourglass-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.waitingText}>{t('liveSurvey.waitingForQuestion')}</Text>
              <Text style={styles.waitingSubtext}>{t('liveSurvey.presenterWillStart')}</Text>
            </View>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Question Card */}
          <Card style={{ marginTop: 16 }}>
            <CardBody>
              <View style={styles.questionHeader}>
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>Q{currentQuestion.questionIndex + 1}</Text>
                </View>
                <Text style={styles.questionTypeLabel}>
                  {isMultiple ? t('liveSurvey.selectMultiple') : t('liveSurvey.selectOne')}
                </Text>
              </View>
              <Text style={styles.questionText}>
                {isAr ? currentQuestion.textAr : currentQuestion.textEn}
              </Text>
            </CardBody>
          </Card>

          {/* Vote Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => {
              const isSelected = selectedOptions.includes(index);
              const disabled = hasVoted || !acceptingVotes;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleSelectOption(index)}
                  disabled={disabled}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionSelected,
                    disabled && !isSelected && styles.optionDisabled,
                  ]}
                >
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                    {isSelected && (
                      <Ionicons
                        name={isMultiple ? 'checkbox' : 'radio-button-on'}
                        size={20}
                        color="#fff"
                      />
                    )}
                    {!isSelected && (
                      <Ionicons
                        name={isMultiple ? 'square-outline' : 'radio-button-off'}
                        size={20}
                        color={disabled ? theme.colors.textMuted : theme.colors.primary}
                      />
                    )}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Submit Button */}
          {hasVoted ? (
            <Card style={{ marginTop: 16 }}>
              <CardBody>
                <View style={styles.votedContainer}>
                  <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
                  <Text style={styles.votedText}>{t('liveSurvey.voteRecorded')}</Text>
                  <Text style={styles.votedSubtext}>{t('liveSurvey.waitingForNext')}</Text>
                </View>
              </CardBody>
            </Card>
          ) : (
            <Button
              variant="primary"
              onPress={handleSubmitVote}
              loading={submitting}
              disabled={!acceptingVotes || selectedOptions.length === 0}
              icon={<Ionicons name="send" size={16} color="#fff" />}
              style={{ marginTop: 16 }}
            >
              {t('liveSurvey.submitVote')}
            </Button>
          )}

          {!acceptingVotes && !hasVoted && (
            <View style={styles.closedBanner}>
              <Ionicons name="lock-closed" size={18} color={theme.colors.warning} />
              <Text style={styles.closedText}>{t('liveSurvey.votingCurrentlyClosed')}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },

  sessionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },

  waitingContainer: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  waitingText: { fontSize: 16, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
  waitingSubtext: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },

  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  questionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionBadgeText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  questionTypeLabel: { fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic' },
  questionText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, lineHeight: 26 },

  optionsContainer: { marginTop: 16, gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionDisabled: { opacity: 0.6 },
  optionRadio: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  optionRadioSelected: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  optionText: { fontSize: 15, fontWeight: '500', color: theme.colors.text, flex: 1 },
  optionTextSelected: { fontWeight: '700', color: theme.colors.primary },

  votedContainer: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  votedText: { fontSize: 16, fontWeight: '700', color: theme.colors.success },
  votedSubtext: { fontSize: 13, color: theme.colors.textMuted },

  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: theme.radius.sm,
  },
  closedText: { fontSize: 13, fontWeight: '500', color: '#b45309', flex: 1 },

  endedTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: 16 },
  endedSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
});
