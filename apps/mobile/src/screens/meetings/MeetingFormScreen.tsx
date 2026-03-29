import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/apiClient';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import type { CommitteeItem, MeetingRoom, MeetingType, PagedResponse } from '../../api/types';
import { Button, Input, Textarea, Select } from '../../components/ui';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

const MEETING_TYPES: MeetingType[] = ['in_person', 'online', 'hybrid'];
const PLATFORMS = ['teams', 'zoom'];

export function MeetingFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id, committeeId: routeCommitteeId } = (route.params ?? {}) as { id?: string; committeeId?: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [type, setType] = useState<MeetingType>('in_person');
  const [committeeId, setCommitteeId] = useState(routeCommitteeId ?? '');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [meetingRoomId, setMeetingRoomId] = useState('');
  const [onlinePlatform, setOnlinePlatform] = useState('');
  const [locationAr, setLocationAr] = useState('');
  const [locationEn, setLocationEn] = useState('');

  const { data: committeesData } = useQuery({
    queryKey: ['committees-select'],
    queryFn: () => api.get<PagedResponse<CommitteeItem>>('/api/v1/committees?pageSize=100&status=active'),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['meeting-rooms'],
    queryFn: () => api.get<MeetingRoom[]>('/api/v1/meeting-rooms?activeOnly=true'),
    enabled: type !== 'online',
  });

  const committeeOptions = (committeesData?.items ?? []).map(c => ({
    value: c.id,
    label: isAr ? c.nameAr : c.nameEn,
  }));

  const roomOptions = (roomsData ?? []).map(r => ({
    value: r.id,
    label: isAr ? r.nameAr : r.nameEn,
    sublabel: r.building ? `${r.building} — ${r.capacity}` : undefined,
  }));

  const mutation = useMutation({
    mutationFn: (data: any) => id ? api.put(`/api/v1/meetings/${id}`, data) : api.post('/api/v1/meetings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meetings'] }); navigation.goBack(); },
    onError: () => Alert.alert(t('errors.generic')),
  });

  const handleSave = () => {
    if (!titleAr.trim() && !titleEn.trim()) {
      Alert.alert(t('errors.validation'));
      return;
    }
    mutation.mutate({
      titleAr, titleEn, descriptionAr, descriptionEn,
      type,
      committeeId: committeeId || undefined,
      startDateTimeUtc: startDate.toISOString(),
      endDateTimeUtc: endDate.toISOString(),
      meetingRoomId: meetingRoomId || undefined,
      onlinePlatform: type !== 'in_person' ? onlinePlatform : undefined,
      location: locationAr || locationEn || undefined,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SearchableSelect
        label={t('meetings.committee')}
        placeholder={t('meetings.committee')}
        options={committeeOptions}
        value={committeeId}
        onSelect={setCommitteeId}
        containerStyle={{ marginBottom: 12 }}
      />

      <Input label={t('meetings.titleAr')} value={titleAr} onChangeText={setTitleAr} />
      <Input label={t('meetings.titleEn')} value={titleEn} onChangeText={setTitleEn} containerStyle={{ marginTop: 12 }} />

      <Textarea label={t('tasks.description') + ' (AR)'} value={descriptionAr} onChangeText={setDescriptionAr} containerStyle={{ marginTop: 12 }} />
      <Textarea label={t('tasks.description') + ' (EN)'} value={descriptionEn} onChangeText={setDescriptionEn} containerStyle={{ marginTop: 12 }} />

      <Text style={styles.sectionTitle}>{t('meetings.type')}</Text>
      <Select
        label={t('meetings.type')}
        value={type}
        options={MEETING_TYPES.map(mt => ({ value: mt, label: t(`meetings.types.${mt}`) }))}
        onValueChange={v => setType(v as MeetingType)}
      />

      <DateTimePicker label={t('meetings.startTime')} value={startDate} onChange={setStartDate} mode="datetime" minimumDate={new Date()} />
      <DateTimePicker label={t('meetings.endTime')} value={endDate} onChange={setEndDate} mode="datetime" minimumDate={startDate} />

      {type !== 'online' && (
        <>
          <SearchableSelect
            label={t('meetings.location')}
            placeholder={t('meetings.location')}
            options={roomOptions}
            value={meetingRoomId}
            onSelect={setMeetingRoomId}
            containerStyle={{ marginTop: 12 }}
          />
          <Input label={t('meetings.location') + ' (AR)'} value={locationAr} onChangeText={setLocationAr} containerStyle={{ marginTop: 12 }} />
          <Input label={t('meetings.location') + ' (EN)'} value={locationEn} onChangeText={setLocationEn} containerStyle={{ marginTop: 12 }} />
        </>
      )}

      {type !== 'in_person' && (
        <Select
          label={t('meetings.onlineLink')}
          value={onlinePlatform}
          options={PLATFORMS.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
          onValueChange={setOnlinePlatform}
          containerStyle={{ marginTop: 12 }}
        />
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
});
