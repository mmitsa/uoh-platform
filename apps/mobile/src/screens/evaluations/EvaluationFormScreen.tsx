import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import { api } from '../../api/apiClient';
import type { Evaluation, EvaluationResponse, EvaluationTemplate, PagedResponse } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Card, CardBody, Input, LoadingSpinner, Select, Textarea } from '../../components/ui';

export function EvaluationFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = (route.params ?? {}) as { id?: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const [templateId, setTemplateId] = useState('');
  const [committeeId, setCommitteeId] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [responses, setResponses] = useState<Record<string, { score: number; notes: string }>>({});

  /* Load templates list */
  const { data: templates } = useQuery({
    queryKey: ['evaluation-templates'],
    queryFn: () => api.get<PagedResponse<EvaluationTemplate>>('/api/v1/evaluation-templates'),
  });

  /* Load selected template details for criteria */
  const { data: selectedTemplate } = useQuery({
    queryKey: ['evaluation-template', templateId],
    queryFn: () => api.get<EvaluationTemplate>(`/api/v1/evaluation-templates/${templateId}`),
    enabled: Boolean(templateId),
  });

  /* Load existing evaluation for editing */
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => api.get<Evaluation>(`/api/v1/evaluations/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setTemplateId(existing.templateId ?? '');
      setCommitteeId(existing.committeeId ?? '');
      setNotesAr(existing.overallNotesAr ?? '');
      setNotesEn(existing.overallNotesEn ?? '');
      if (existing.responses) {
        const map: Record<string, { score: number; notes: string }> = {};
        existing.responses.forEach((r) => {
          map[r.criteriaId] = { score: r.score, notes: r.notes ?? '' };
        });
        setResponses(map);
      }
    }
  }, [existing]);

  /* Initialize responses when template criteria load */
  useEffect(() => {
    if (selectedTemplate?.criteria && !isEdit) {
      const map: Record<string, { score: number; notes: string }> = {};
      selectedTemplate.criteria.forEach((c) => {
        if (!responses[c.id]) {
          map[c.id] = { score: 0, notes: '' };
        }
      });
      if (Object.keys(map).length > 0) {
        setResponses((prev) => ({ ...map, ...prev }));
      }
    }
  }, [selectedTemplate]);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      isEdit ? api.put(`/api/v1/evaluations/${id}`, body) : api.post('/api/v1/evaluations', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
      if (id) qc.invalidateQueries({ queryKey: ['evaluation', id] });
      navigation.goBack();
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleSave = () => {
    if (!templateId) {
      Alert.alert(t('errors.validation'), t('evaluations.templateRequired'));
      return;
    }
    const evaluationResponses: EvaluationResponse[] = Object.entries(responses).map(
      ([criteriaId, val]) => ({
        criteriaId,
        score: val.score,
        notes: val.notes || undefined,
      }),
    );
    const overallScore = evaluationResponses.length > 0
      ? Math.round(evaluationResponses.reduce((acc, r) => acc + r.score, 0) / evaluationResponses.length)
      : 0;

    mutation.mutate({
      templateId,
      committeeId: committeeId || undefined,
      overallNotesAr: notesAr || undefined,
      overallNotesEn: notesEn || undefined,
      overallScore,
      responses: evaluationResponses,
    });
  };

  const updateScore = (criteriaId: string, score: number) => {
    setResponses((prev) => ({
      ...prev,
      [criteriaId]: { ...(prev[criteriaId] ?? { notes: '' }), score },
    }));
  };

  const updateNotes = (criteriaId: string, notes: string) => {
    setResponses((prev) => ({
      ...prev,
      [criteriaId]: { ...(prev[criteriaId] ?? { score: 0 }), notes },
    }));
  };

  if (isEdit && loadingExisting) return <LoadingSpinner />;

  const criteria = selectedTemplate?.criteria ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Template selection */}
      <Select
        label={t('evaluations.template')}
        value={templateId}
        options={(templates?.items ?? []).map((tmpl) => ({
          value: tmpl.id,
          label: isAr ? tmpl.nameAr : tmpl.nameEn,
        }))}
        onChange={setTemplateId}
        placeholder={t('evaluations.selectTemplate')}
      />

      <Input
        label={t('evaluations.committeeId')}
        value={committeeId}
        onChangeText={setCommitteeId}
        containerStyle={{ marginTop: 12 }}
      />

      <Textarea
        label={t('evaluations.notesAr')}
        value={notesAr}
        onChangeText={setNotesAr}
        containerStyle={{ marginTop: 12 }}
      />
      <Textarea
        label={t('evaluations.notesEn')}
        value={notesEn}
        onChangeText={setNotesEn}
        containerStyle={{ marginTop: 12 }}
      />

      {/* Criteria Scoring */}
      {criteria.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>{t('evaluations.scoreCriteria')}</Text>
            {criteria.map((c) => {
              const maxS = c.maxScore ?? 10;
              const currentScore = responses[c.id]?.score ?? 0;
              const currentNotes = responses[c.id]?.notes ?? '';

              return (
                <View key={c.id} style={styles.criteriaBlock}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaLabel}>
                      {isAr ? c.labelAr : c.labelEn}
                    </Text>
                    <Text style={styles.criteriaScoreLabel}>
                      {currentScore}/{maxS}
                    </Text>
                  </View>
                  {(isAr ? c.descriptionAr : c.descriptionEn) && (
                    <Text style={styles.criteriaDesc}>
                      {isAr ? c.descriptionAr : c.descriptionEn}
                    </Text>
                  )}
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={maxS}
                    step={1}
                    value={currentScore}
                    onValueChange={(val) => updateScore(c.id, val)}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                  />
                  <Input
                    placeholder={t('evaluations.criteriaNotesPlaceholder')}
                    value={currentNotes}
                    onChangeText={(val) => updateNotes(c.id, val)}
                    containerStyle={{ marginTop: 4 }}
                  />
                </View>
              );
            })}
          </CardBody>
        </Card>
      )}

      <View style={styles.actions}>
        <Button variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }}>
          {t('actions.cancel')}
        </Button>
        <Button onPress={handleSave} loading={mutation.isPending} style={{ flex: 1 }}>
          {t('actions.save')}
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    criteriaBlock: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    criteriaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    criteriaLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, flex: 1 },
    criteriaScoreLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
    criteriaDesc: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
      marginBottom: 4,
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  });
