import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { MeetingItem, AttendanceRecord } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';

type AgendaItem = {
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  durationMinutes?: number;
  presenterName?: string;
  order: number;
};

type Invitee = {
  userId: string;
  displayName: string;
  email?: string;
  attendanceStatus?: string;
};

const ATT_COLORS: Record<string, string> = {
  present: '#10b981', absent: '#ef4444', excused: '#f59e0b', late: '#3b82f6',
};
const ATT_ICONS: Record<string, string> = {
  present: 'checkmark-circle', absent: 'close-circle', excused: 'alert-circle', late: 'time',
};

export function MeetingDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = route.params as { id: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'info' | 'agenda' | 'attendance'>('info');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => api.get<MeetingItem>(`/api/v1/meetings/${id}`),
  });

  const { data: agenda } = useQuery({
    queryKey: ['meeting-agenda', id],
    queryFn: () => api.get<AgendaItem[]>(`/api/v1/meetings/${id}/agenda`),
  });

  const { data: invitees } = useQuery({
    queryKey: ['meeting-invitees', id],
    queryFn: () => api.get<Invitee[]>(`/api/v1/meetings/${id}/invitees`),
  });

  const approveMut = useMutation({
    mutationFn: () => api.post(`/api/v1/meetings/${id}/approve`),
    onSuccess: () => { void refetch(); qc.invalidateQueries({ queryKey: ['meetings'] }); Alert.alert(t('common.success'), t('meetings.approved')); },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const rejectMut = useMutation({
    mutationFn: () => api.post(`/api/v1/meetings/${id}/reject`),
    onSuccess: () => { void refetch(); qc.invalidateQueries({ queryKey: ['meetings'] }); Alert.alert(t('common.success'), t('meetings.rejected')); },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  const attendanceMut = useMutation({
    mutationFn: (status: string) => api.post(`/api/v1/meetings/${id}/attendance`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-invitees', id] });
      Alert.alert(t('common.success'), t('meetings.attendanceMarked'));
    },
    onError: () => Alert.alert(t('common.error'), t('common.errorOccurred')),
  });

  function confirmApprove() {
    Alert.alert(t('actions.approve'), t('meetings.approveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('actions.approve'), onPress: () => approveMut.mutate() },
    ]);
  }

  function confirmReject() {
    Alert.alert(t('actions.reject'), t('meetings.rejectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('actions.reject'), style: 'destructive', onPress: () => rejectMut.mutate() },
    ]);
  }

  function markAttendance(status: string) {
    attendanceMut.mutate(status);
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const tabs = [
    { key: 'info' as const, label: t('meetings.info') },
    { key: 'agenda' as const, label: t('meetings.agenda') },
    { key: 'attendance' as const, label: t('meetings.attendance') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header Card */}
      <Card>
        <CardBody>
          <Text style={styles.name}>{isAr ? data.titleAr : data.titleEn}</Text>
          <View style={styles.row}>
            <Badge variant="brand" label={t(`meetings.types.${data.type}`, data.type)} />
            <Badge variant={data.status === 'completed' ? 'success' : data.status === 'cancelled' ? 'danger' : 'info'} label={t(`meetings.statuses.${data.status}`, data.status)} />
          </View>
        </CardBody>
      </Card>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <Card>
          <CardBody>
            <View style={styles.detail}>
              <Ionicons name="calendar" size={16} color={theme.colors.textMuted} />
              <Text style={styles.detailText}>{new Date(data.startDateTimeUtc).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</Text>
            </View>
            {data.locationAr && (
              <View style={styles.detail}>
                <Ionicons name="location" size={16} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{isAr ? data.locationAr : data.locationEn}</Text>
              </View>
            )}
            {data.onlineLink && (
              <View style={styles.detail}>
                <Ionicons name="link" size={16} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{data.onlineLink}</Text>
              </View>
            )}

            {/* Approval Actions */}
            {(data.status === 'draft' || data.status === 'scheduled') && (
              <View style={styles.approvalSection}>
                <Text style={styles.approvalTitle}>{t('meetings.approvalActions')}</Text>
                <View style={styles.approvalButtons}>
                  <Button variant="primary" onPress={confirmApprove} loading={approveMut.isPending} icon={<Ionicons name="checkmark" size={16} color="#fff" />} style={{ flex: 1 }}>
                    {t('actions.approve')}
                  </Button>
                  <Button variant="danger" onPress={confirmReject} loading={rejectMut.isPending} icon={<Ionicons name="close" size={16} color="#fff" />} style={{ flex: 1 }}>
                    {t('actions.reject')}
                  </Button>
                </View>
              </View>
            )}
          </CardBody>
        </Card>
      )}

      {/* Agenda Tab */}
      {activeTab === 'agenda' && (
        <>
          {agenda && agenda.length > 0 ? (
            agenda.map((item, idx) => (
              <Card key={idx} style={{ marginTop: 8 }}>
                <CardBody>
                  <View style={styles.agendaHeader}>
                    <View style={styles.agendaNumber}>
                      <Text style={styles.agendaNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agendaTitle}>{isAr ? item.titleAr : item.titleEn}</Text>
                      <Text style={styles.agendaSubtitle}>{isAr ? item.titleEn : item.titleAr}</Text>
                    </View>
                    {item.durationMinutes ? (
                      <Text style={styles.agendaDuration}>{item.durationMinutes} {t('meetings.minutes')}</Text>
                    ) : null}
                  </View>
                  {(item.descriptionAr || item.descriptionEn) && (
                    <Text style={styles.agendaDescription}>{isAr ? item.descriptionAr : item.descriptionEn}</Text>
                  )}
                  {item.presenterName && (
                    <View style={[styles.detail, { marginTop: 6 }]}>
                      <Ionicons name="person" size={14} color={theme.colors.textMuted} />
                      <Text style={[styles.detailText, { fontSize: 13 }]}>{item.presenterName}</Text>
                    </View>
                  )}
                </CardBody>
              </Card>
            ))
          ) : (
            <Card><CardBody>
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </CardBody></Card>
          )}
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <Card>
          <CardBody>
            {/* Mark My Attendance */}
            {(data.status === 'scheduled' || data.status === 'in_progress') && (
              <View style={styles.myAttendance}>
                <Text style={styles.myAttendanceTitle}>{t('meetings.markAttendance')}</Text>
                <View style={styles.attendanceOptions}>
                  {['present', 'absent', 'excused', 'late'].map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => markAttendance(status)}
                      style={[styles.attOption, { borderColor: ATT_COLORS[status] }]}
                    >
                      <Ionicons name={(ATT_ICONS[status] ?? 'ellipse') as any} size={20} color={ATT_COLORS[status]} />
                      <Text style={[styles.attOptionText, { color: ATT_COLORS[status] }]}>
                        {t(`meetings.attendanceStatuses.${status}`, status)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Invitees List */}
            <Text style={styles.sectionTitle}>{t('meetings.invitees')}</Text>
            {invitees && invitees.length > 0 ? (
              invitees.map((inv) => {
                const attStatus = inv.attendanceStatus ?? 'unknown';
                return (
                  <View key={inv.userId} style={styles.inviteeRow}>
                    <Ionicons
                      name={(ATT_ICONS[attStatus] ?? 'ellipse-outline') as any}
                      size={18}
                      color={ATT_COLORS[attStatus] ?? theme.colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inviteeName}>{inv.displayName}</Text>
                      {inv.email && <Text style={styles.inviteeEmail}>{inv.email}</Text>}
                    </View>
                    <Text style={[styles.attLabel, { color: ATT_COLORS[attStatus] ?? theme.colors.textMuted }]}>
                      {t(`meetings.attendanceStatuses.${attStatus}`, attStatus)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            )}
          </CardBody>
        </Card>
      )}

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => navigation.navigate('MeetingForm', { id })} style={{ flex: 1 }}>
          {t('actions.edit')}
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  detailText: { fontSize: 14, color: theme.colors.textSecondary, flex: 1 },

  tabBar: { flexDirection: 'row', marginTop: 16, marginBottom: 8, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radius.sm },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  tabTextActive: { color: '#fff' },

  approvalSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  approvalTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  approvalButtons: { flexDirection: 'row', gap: 10 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },

  agendaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agendaNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  agendaNumberText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  agendaTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  agendaSubtitle: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  agendaDuration: { fontSize: 12, color: theme.colors.textMuted },
  agendaDescription: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8 },

  myAttendance: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  myAttendanceTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  attendanceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1.5, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surface,
  },
  attOptionText: { fontSize: 13, fontWeight: '600' },

  inviteeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  inviteeName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  inviteeEmail: { fontSize: 12, color: theme.colors.textMuted },
  attLabel: { fontSize: 12, fontWeight: '600' },

  emptyText: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 32 },
});
