import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import type { TaskPriority } from '../../api/types';
import { Button, Input, Textarea, Select } from '../../components/ui';
import { DateTimePicker } from '../../components/ui/DateTimePicker';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export function TaskFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = (route.params ?? {}) as { id?: string };
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [assignedTo, setAssignedTo] = useState('');
  const [category, setCategory] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => id ? api.put(`/api/v1/tasks/${id}`, data) : api.post('/api/v1/tasks', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); navigation.goBack(); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  const handleSave = () => {
    if (!titleAr.trim() && !titleEn.trim()) {
      Alert.alert(t('errors.validation'));
      return;
    }
    mutation.mutate({
      titleAr, titleEn, descriptionAr, descriptionEn,
      priority,
      dueDateUtc: dueDate.toISOString(),
      assignedToDisplayName: assignedTo || undefined,
      category: category || undefined,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Input label={t('tasks.titleAr')} value={titleAr} onChangeText={setTitleAr} />
      <Input label={t('tasks.titleEn')} value={titleEn} onChangeText={setTitleEn} containerStyle={{ marginTop: 12 }} />

      <Textarea label={t('tasks.description') + ' (AR)'} value={descriptionAr} onChangeText={setDescriptionAr} containerStyle={{ marginTop: 12 }} />
      <Textarea label={t('tasks.description') + ' (EN)'} value={descriptionEn} onChangeText={setDescriptionEn} containerStyle={{ marginTop: 12 }} />

      <Select
        label={t('tasks.priority')}
        value={priority}
        options={PRIORITIES.map(p => ({ value: p, label: t(`tasks.priorities.${p}`) }))}
        onValueChange={v => setPriority(v as TaskPriority)}
        containerStyle={{ marginTop: 12 }}
      />

      <DateTimePicker label={t('tasks.dueDate')} value={dueDate} onChange={setDueDate} mode="date" minimumDate={new Date()} />

      <Input label={t('tasks.assignedTo')} value={assignedTo} onChangeText={setAssignedTo} containerStyle={{ marginTop: 12 }} />
      <Input label="Category" value={category} onChangeText={setCategory} containerStyle={{ marginTop: 12 }} />

      <View style={styles.actions}>
        <Button variant="ghost" onPress={() => navigation.goBack()} style={{ flex: 1 }}>{t('actions.cancel')}</Button>
        <Button onPress={handleSave} loading={mutation.isPending} style={{ flex: 1 }}>{t('actions.save')}</Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
});
