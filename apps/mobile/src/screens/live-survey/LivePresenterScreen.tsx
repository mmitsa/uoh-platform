import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, Badge, LoadingSpinner } from '../../components/ui';
import { useSignalR } from '../../hooks/useSignalR';
import { getHub } from '../../services/signalr';

/* ---- Types ---- */

interface SurveyQuestion {
  id: string;
  order: number;
  textAr: string;
  textEn: string;
  type: string;
  optionsJson: string | null;
}

interface VoteTally {
  optionIndex: number;
  label: string;
  count: number;
}

interface SessionState {
  sessionId: string;
  status: string;
  currentQuestionIndex: number;
  questions: SurveyQuestion[];
  acceptingVotes: boolean;
  participantCount: number;
  voteTally: VoteTally[];
}

/* ---- Helpers ---- */

function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

/* ---- Component ---- */

export function LivePresenterScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { sessionId, surveyId } = route.params as { sessionId: string; surveyId: string };

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptingVotes, setAcceptingVotes] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [voteTally, setVoteTally] = useState<VoteTally[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlers = useMemo(() => ({
    SessionState: (state: SessionState) => {
      setQuestions(state.questions);
      setCurrentIndex(state.currentQuestionIndex);
      setAcceptingVotes(state.acceptingVotes);
      setParticipantCount(state.participantCount);
      setVoteTally(state.voteTally ?? []);
      setLoading(false);
    },
    QuestionChanged: (data: { questionIndex: number; voteTally: VoteTally[] }) => {
      setCurrentIndex(data.questionIndex);
      setVoteTally(data.voteTally ?? []);
    },
    VoteTallyUpdated: (data: { voteTally: VoteTally[] }) => {
      setVoteTally(data.voteTally);
    },
    VotingStateChanged: (data: { acceptingVotes: boolean }) => {
      setAcceptingVotes(data.acceptingVotes);
    },
    ParticipantCountChanged: (data: { count: number }) => {
      setParticipantCount(data.count);
    },
    SessionEnded: () => {
      setSessionEnded(true);
    },
  }), []);

  const connectionRef = useSignalR('live-survey', handlers);

  // Join as presenter once connected
  useEffect(() => {
    const timer = setTimeout(() => {
      const hub = getHub('live-survey');
      if (hub) {
        hub.invoke('JoinAsPresenter', sessionId).catch(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  const invokeHub = useCallback((method: string, ...args: any[]) => {
    const hub = getHub('live-survey');
    if (hub) {
      hub.invoke(method, ...args).catch((err: Error) => {
        Alert.alert(t('common.error'), err.message);
      });
    }
  }, [t]);

  const handleNext = () => invokeHub('NextQuestion', sessionId);
  const handlePrev = () => invokeHub('PreviousQuestion', sessionId);
  const handleToggleVoting = () => invokeHub('SetVotingState', sessionId, !acceptingVotes);

  const handleEndSession = () => {
    Alert.alert(
      t('liveSurvey.endSession'),
      t('liveSurvey.endSessionConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('liveSurvey.endSession'),
          style: 'destructive',
          onPress: () => invokeHub('EndSession', sessionId),
        },
      ],
    );
  };

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion ? parseOptions(currentQuestion.optionsJson) : [];
  const maxVotes = Math.max(1, ...voteTally.map(v => v.count));

  if (loading) return <LoadingSpinner />;

  if (sessionEnded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
        <Text style={styles.endedTitle}>{t('liveSurvey.sessionEnded')}</Text>
        <Text style={styles.endedSubtitle}>{t('liveSurvey.sessionEndedDesc')}</Text>
        <Button variant="primary" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={theme.colors.primary} />
          <Text style={styles.statNumber}>{participantCount}</Text>
          <Text style={styles.statLabel}>{t('liveSurvey.participants')}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="help-circle" size={20} color={theme.colors.info} />
          <Text style={styles.statNumber}>{currentIndex + 1}/{questions.length}</Text>
          <Text style={styles.statLabel}>{t('liveSurvey.question')}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons
            name={acceptingVotes ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={acceptingVotes ? theme.colors.success : theme.colors.danger}
          />
          <Text style={[styles.statNumber, { color: acceptingVotes ? theme.colors.success : theme.colors.danger }]}>
            {acceptingVotes ? t('liveSurvey.open') : t('liveSurvey.closed')}
          </Text>
          <Text style={styles.statLabel}>{t('liveSurvey.voting')}</Text>
        </View>
      </View>

      {/* Current Question */}
      {currentQuestion && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <View style={styles.questionHeader}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>Q{currentIndex + 1}</Text>
              </View>
              <Badge
                variant={acceptingVotes ? 'success' : 'default'}
                label={acceptingVotes ? t('liveSurvey.votingOpen') : t('liveSurvey.votingClosed')}
                size="sm"
              />
            </View>
            <Text style={styles.questionText}>
              {isAr ? currentQuestion.textAr : currentQuestion.textEn}
            </Text>
            <Text style={styles.questionType}>
              {currentQuestion.type}
            </Text>
          </CardBody>
        </Card>
      )}

      {/* Vote Tally Bar Chart */}
      {(voteTally.length > 0 || options.length > 0) && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('liveSurvey.results')}</Text>
            {(voteTally.length > 0 ? voteTally : options.map((label, i) => ({ optionIndex: i, label, count: 0 }))).map((item, idx) => {
              const pct = maxVotes > 0 ? (item.count / maxVotes) * 100 : 0;
              const totalVotes = voteTally.reduce((sum, v) => sum + v.count, 0);
              const realPct = totalVotes > 0 ? ((item.count / totalVotes) * 100).toFixed(1) : '0.0';
              return (
                <View key={idx} style={styles.tallyRow}>
                  <View style={styles.tallyLabelRow}>
                    <Text style={styles.tallyLabel} numberOfLines={1}>
                      {item.label || options[item.optionIndex] || `Option ${item.optionIndex + 1}`}
                    </Text>
                    <Text style={styles.tallyCount}>{item.count} ({realPct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                  </View>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('liveSurvey.totalVotes')}</Text>
              <Text style={styles.totalCount}>{voteTally.reduce((s, v) => s + v.count, 0)}</Text>
            </View>
          </CardBody>
        </Card>
      )}

      {/* Navigation Controls */}
      <View style={styles.navRow}>
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex <= 0}
          style={[styles.navButton, currentIndex <= 0 && styles.navDisabled]}
        >
          <Ionicons name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color={currentIndex > 0 ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.navText, currentIndex <= 0 && { color: theme.colors.textMuted }]}>
            {t('liveSurvey.previous')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={currentIndex >= questions.length - 1}
          style={[styles.navButton, currentIndex >= questions.length - 1 && styles.navDisabled]}
        >
          <Text style={[styles.navText, currentIndex >= questions.length - 1 && { color: theme.colors.textMuted }]}>
            {t('liveSurvey.next')}
          </Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={24} color={currentIndex < questions.length - 1 ? theme.colors.primary : theme.colors.textMuted} />
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          variant={acceptingVotes ? 'danger' : 'primary'}
          onPress={handleToggleVoting}
          icon={<Ionicons name={acceptingVotes ? 'stop' : 'play'} size={16} color="#fff" />}
          style={{ flex: 1 }}
        >
          {acceptingVotes ? t('liveSurvey.closeVoting') : t('liveSurvey.openVoting')}
        </Button>
      </View>

      <Button
        variant="danger"
        onPress={handleEndSession}
        icon={<Ionicons name="power" size={16} color="#fff" />}
        style={{ marginTop: 12 }}
      >
        {t('liveSurvey.endSession')}
      </Button>
    </ScrollView>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 4,
  },
  statNumber: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center' },

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
  questionText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, lineHeight: 26 },
  questionType: { fontSize: 12, color: theme.colors.textMuted, marginTop: 8, textTransform: 'capitalize' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },

  tallyRow: { marginBottom: 14 },
  tallyLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tallyLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.text, flex: 1 },
  tallyCount: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  barTrack: {
    height: 10,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  totalLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  totalCount: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  navButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 4 },
  navDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },

  endedTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: 16 },
  endedSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
});
