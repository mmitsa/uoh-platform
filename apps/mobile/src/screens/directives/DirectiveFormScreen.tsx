import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import type { Directive } from '../../api/types';
import { useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Input, LoadingSpinner, Select, Textarea } from '../../components/ui';

const STATUSES = ['draft', 'active', 'closed'] as const;

export function DirectiveFormScreen({ route, navigation }: any) {
  const styles = useThemedStyles(createStyles);
  const { id } = (route.params ?? {}) as { id?: string };
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [status, setStatus] = useState<string>('draft');

  /* Load existing directive for editing */
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['directive', id],
    queryFn: () => api.get<Directive>(`/api/v1/directives/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setTitleAr(existing.titleAr ?? '');
      setTitleEn(existing.titleEn ?? '');
      setDescriptionAr(existing.descriptionAr ?? '');
      setDescriptionEn(existing.descriptionEn ?? '');
      setIssuedBy(existing.issuedBy ?? '');
      setReferenceNumber(existing.referenceNumber ?? '');
      setStatus(existing.status ?? 'draft');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      isEdit ? api.put(`/api/v1/directives/${id}`, body) : api.post('/api/v1/directives', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['directives'] });
      if (id) qc.invalidateQueries({ queryKey: ['directive', id] });
      navigation.goBack();
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const handleSave = () => {
    if (!titleAr.trim() && !titleEn.trim()) {
      Alert.alert(t('errors.validation'), t('directives.titleRequired'));
      return;
    }
    mutation.mutate({
      titleAr,
      titleEn,
      descriptionAr: descriptionAr || undefined,
      descriptionEn: descriptionEn || undefined,
      issuedBy: issuedBy || undefined,
      referenceNumber: referenceNumber || undefined,
      status,
    });
  };

  if (isEdit && loadingExisting) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Input
        label={t('directives.titleAr')}
        value={titleAr}
        onChangeText={setTitleAr}
      />
      <Input
        label={t('directives.titleEn')}
        value={titleEn}
        onChangeText={setTitleEn}
        containerStyle={{ marginTop: 12 }}
      />

      <Textarea
        label={t('directives.descriptionAr')}
        value={descriptionAr}
        onChangeText={setDescriptionAr}
        containerStyle={{ marginTop: 12 }}
      />
      <Textarea
        label={t('directives.descriptionEn')}
        value={descriptionEn}
        onChangeText={setDescriptionEn}
        containerStyle={{ marginTop: 12 }}
      />

      <Input
        label={t('directives.issuedBy')}
        value={issuedBy}
        onChangeText={setIssuedBy}
        containerStyle={{ marginTop: 12 }}
      />
      <Input
        label={t('directives.referenceNumber')}
        value={referenceNumber}
        onChangeText={setReferenceNumber}
        containerStyle={{ marginTop: 12 }}
      />

      <Select
        label={t('directives.status')}
        value={status}
        options={STATUSES.map((s) => ({
          value: s,
          label: t(`directives.statuses.${s}`, s),
        }))}
        onChange={(v) => setStatus(v)}
      />

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
    actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  });
