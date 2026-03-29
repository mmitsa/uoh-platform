import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Button, Input } from '../../components/ui';

export function MeetingFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = (route.params ?? {}) as { id?: string };
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => id ? api.put(`/api/v1/meetings/${id}`, data) : api.post('/api/v1/meetings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meetings'] }); navigation.goBack(); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Input label={t('meetings.titleAr')} value={titleAr} onChangeText={setTitleAr} />
      <Input label={t('meetings.titleEn')} value={titleEn} onChangeText={setTitleEn} containerStyle={{ marginTop: 12 }} />
      <View style={styles.actions}>
        <Button variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }}>{t('actions.cancel')}</Button>
        <Button onPress={() => mutation.mutate({ titleAr, titleEn, type: 'in_person' })} loading={mutation.isPending} style={{ flex: 1 }}>{t('actions.save')}</Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
