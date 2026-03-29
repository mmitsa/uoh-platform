import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Input } from '../../components/ui';
import type { CommitteeType } from '../../api/types';

const ALL_TYPES: { value: CommitteeType; icon: string }[] = [
  { value: 'permanent', icon: '🔵' },
  { value: 'temporary', icon: '⏱️' },
  { value: 'main', icon: '🏢' },
  { value: 'sub', icon: '📎' },
  { value: 'council', icon: '🏛️' },
  { value: 'self_managed', icon: '🤝' },
  { value: 'cross_functional', icon: '🔀' },
];

export function CommitteeFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = (route.params ?? {}) as { id?: string };
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [type, setType] = useState<CommitteeType>('permanent');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => id ? api.put(`/api/v1/committees/${id}`, data) : api.post('/api/v1/committees', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['committees'] }); navigation.goBack(); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  function handleSave() {
    const body: Record<string, unknown> = { nameAr, nameEn, type };
    if (descriptionAr) body.descriptionAr = descriptionAr;
    if (descriptionEn) body.descriptionEn = descriptionEn;
    if (type === 'temporary' && startDate) body.startDate = startDate;
    if (type === 'temporary' && endDate) body.endDate = endDate;
    mutation.mutate(body);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Type selector */}
      <Text style={styles.label}>{t('committees.type')}</Text>
      <View style={styles.typeGrid}>
        {ALL_TYPES.map((tp) => (
          <Pressable
            key={tp.value}
            onPress={() => setType(tp.value)}
            style={[styles.typeChip, type === tp.value && styles.typeChipActive]}
          >
            <Text style={styles.typeIcon}>{tp.icon}</Text>
            <Text style={[styles.typeLabel, type === tp.value && styles.typeLabelActive]}>
              {t(`committees.types.${tp.value}` as any)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label={t('committees.nameAr')} value={nameAr} onChangeText={setNameAr} />
      <Input label={t('committees.nameEn')} value={nameEn} onChangeText={setNameEn} containerStyle={{ marginTop: 12 }} />
      <Input label={isAr ? 'الوصف (عربي)' : 'Description (Arabic)'} value={descriptionAr} onChangeText={setDescriptionAr} containerStyle={{ marginTop: 12 }} />
      <Input label={isAr ? 'الوصف (إنجليزي)' : 'Description (English)'} value={descriptionEn} onChangeText={setDescriptionEn} containerStyle={{ marginTop: 12 }} />

      {type === 'temporary' && (
        <>
          <Input label={isAr ? 'تاريخ البداية' : 'Start Date'} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" containerStyle={{ marginTop: 12 }} />
          <Input label={isAr ? 'تاريخ النهاية' : 'End Date'} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" containerStyle={{ marginTop: 12 }} />
        </>
      )}

      <View style={styles.actions}>
        <Button variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }}>{t('actions.cancel')}</Button>
        <Button onPress={handleSave} loading={mutation.isPending} style={{ flex: 1 }}>{t('actions.save')}</Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  typeChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight ?? '#E8F0FE' },
  typeIcon: { fontSize: 16 },
  typeLabel: { fontSize: 13, color: theme.colors.textSecondary },
  typeLabelActive: { color: theme.colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
