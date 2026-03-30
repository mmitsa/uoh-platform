import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

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
  status: string;
  questions: SurveyQuestion[];
}

function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function SurveyResponseScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get<SurveyDetail>(`/api/v1/surveys/${id}`),
  });

  const submitMut = useMutation({
    mutationFn: () => {
      const answerList = Object.entries(answers).map(([questionId, value]) => ({
        surveyQuestionId: questionId,
        value,
      }));
      return api.post(`/api/v1/surveys/${id}/responses`, { answers: answerList });
    },
    onSuccess: () => {
      Alert.alert(t('common.success'), t('surveys.responseSubmitted'), [
        { text: t('actions.close'), onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultiOption(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  function handleSubmit() {
    Alert.alert(
      t('surveys.submitResponse'),
      t('surveys.confirmSubmit'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('actions.submit'), onPress: () => submitMut.mutate() },
      ],
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  if (data.status !== 'active') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={48} color={theme.colors.textMuted} />
        <Text style={styles.closedText}>{t('surveys.surveyNotActive')}</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>{t('actions.back')}</Button>
      </View>
    );
  }

  const sortedQuestions = [...data.questions].sort((a, b) => a.order - b.order);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = sortedQuestions.length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>{answeredCount} / {totalQuestions}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={styles.title}>{isAr ? data.titleAr : data.titleEn}</Text>

        {sortedQuestions.map((q, idx) => {
          const qText = isAr ? q.textAr : q.textEn;
          const options = parseOptions(q.optionsJson);

          return (
            <Card key={q.id} style={{ marginTop: 16 }}>
              <CardBody>
                <View style={styles.questionHeader}>
                  <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>{q.order}</Text>
                  </View>
                  <Text style={styles.questionText}>{qText}</Text>
                </View>

                {/* Single Choice */}
                {q.type === 'single' && options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <Pressable key={optIdx} onPress={() => setAnswer(q.id, opt)} style={[styles.optionRow, isSelected && styles.optionRowSelected]}>
                          <View style={[styles.radio, isSelected && styles.radioSelected]}>
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text style={[styles.optionText, isSelected && { color: theme.colors.primary }]}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Multiple Choice */}
                {(q.type === 'multi' || q.type === 'multiple') && options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {options.map((opt, optIdx) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <Pressable key={optIdx} onPress={() => toggleMultiOption(q.id, opt)} style={[styles.optionRow, selected && styles.optionRowSelected]}>
                          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                            {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                          <Text style={[styles.optionText, selected && { color: theme.colors.primary }]}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Text */}
                {q.type === 'text' && (
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    placeholder={t('surveys.typeAnswer')}
                    placeholderTextColor={theme.colors.textMuted}
                    value={(answers[q.id] as string) ?? ''}
                    onChangeText={(text) => setAnswer(q.id, text)}
                    textAlignVertical="top"
                  />
                )}

                {/* Rating */}
                {q.type === 'rating' && (
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} onPress={() => setAnswer(q.id, star)}>
                        <Ionicons
                          name={(answers[q.id] as number) >= star ? 'star' : 'star-outline'}
                          size={36}
                          color={(answers[q.id] as number) >= star ? '#f59e0b' : theme.colors.borderLight}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Yes/No */}
                {q.type === 'yesno' && (
                  <View style={styles.yesNoContainer}>
                    <Pressable onPress={() => setAnswer(q.id, 'yes')} style={[styles.yesNoBtn, answers[q.id] === 'yes' && styles.yesNoBtnYes]}>
                      <Ionicons name="checkmark-circle" size={24} color={answers[q.id] === 'yes' ? '#10b981' : theme.colors.textMuted} />
                      <Text style={[styles.yesNoText, answers[q.id] === 'yes' && { color: '#10b981' }]}>{t('common.yes')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setAnswer(q.id, 'no')} style={[styles.yesNoBtn, answers[q.id] === 'no' && styles.yesNoBtnNo]}>
                      <Ionicons name="close-circle" size={24} color={answers[q.id] === 'no' ? '#ef4444' : theme.colors.textMuted} />
                      <Text style={[styles.yesNoText, answers[q.id] === 'no' && { color: '#ef4444' }]}>{t('common.no')}</Text>
                    </Pressable>
                  </View>
                )}
              </CardBody>
            </Card>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitBar}>
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={submitMut.isPending}
          disabled={answeredCount === 0}
          icon={<Ionicons name="send" size={16} color="#fff" />}
          style={{ flex: 1 }}
        >
          {t('surveys.submitResponse')}
        </Button>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: theme.colors.background, gap: 16 },
  closedText: { fontSize: 16, color: theme.colors.textMuted, textAlign: 'center' },

  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  progressBar: { flex: 1, height: 6, backgroundColor: theme.colors.borderLight, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted },

  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },

  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  questionBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  questionBadgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text, lineHeight: 22 },

  optionsContainer: { marginTop: 14, gap: 6 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm,
  },
  optionRowSelected: { borderColor: theme.colors.primary, backgroundColor: '#eff6ff' },
  optionText: { flex: 1, fontSize: 14, color: theme.colors.text },

  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: theme.colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },

  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

  textInput: {
    marginTop: 12, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.colors.text, minHeight: 80,
  },

  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },

  yesNoContainer: { flexDirection: 'row', gap: 12, marginTop: 14 },
  yesNoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderWidth: 1.5, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm,
  },
  yesNoBtnYes: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  yesNoBtnNo: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  yesNoText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },

  submitBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    flexDirection: 'row', padding: 16, backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
  },
});
