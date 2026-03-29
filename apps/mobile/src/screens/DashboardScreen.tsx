import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/apiClient';
import type { DashboardStats } from '../api/types';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import type { Theme } from '../ui/theme';
import { Card, CardBody, LoadingSpinner } from '../components/ui';
import { useRefreshControl } from '../hooks/useRefreshControl';

export function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/api/v1/dashboard/stats'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
    return (
      <Card style={styles.stat}>
        <CardBody>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </CardBody>
      </Card>
    );
  }

  if (isLoading && !data) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
      <Text style={styles.title}>{t('dashboard.title')}</Text>

      <View style={styles.grid}>
        <StatCard label={t('dashboard.totalCommittees')} value={data?.totalCommittees ?? 0} icon="people-outline" color={theme.colors.primary} />
        <StatCard label={t('dashboard.totalMeetings')} value={data?.totalMeetings ?? 0} icon="calendar-outline" color={theme.colors.info} />
        <StatCard label={t('dashboard.pendingTasks')} value={data?.pendingTasks ?? 0} icon="time-outline" color={theme.colors.warning} />
        <StatCard label={t('dashboard.overdueTasks')} value={data?.overdueTasks ?? 0} icon="alert-circle-outline" color={theme.colors.danger} />
        <StatCard label={t('dashboard.liveMeetingsNow')} value={data?.liveMeetingsNow ?? 0} icon="radio-outline" color={theme.colors.danger} />
        <StatCard label={t('dashboard.upcomingMeetingsCount')} value={data?.upcomingMeetingsCount ?? 0} icon="calendar-outline" color={theme.colors.success} />
      </View>

      {/* Upcoming meetings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.upcomingMeetings')}</Text>
        {(data?.upcomingMeetings ?? []).map(m => (
          <Pressable key={m.id} style={styles.meetingItem} onPress={() => navigation.navigate('MeetingsTab', { screen: 'MeetingDetail', params: { id: m.id } })}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1, marginStart: 12 }}>
              <Text style={styles.meetingTitle}>{isAr ? m.titleAr : m.titleEn}</Text>
              <Text style={styles.meetingDate}>{new Date(m.startDateTimeUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium' })}</Text>
            </View>
          </Pressable>
        ))}
        {!data?.upcomingMeetings?.length && <Text style={styles.empty}>{t('common.noData')}</Text>}
      </View>

      {/* Recent activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
        {(data?.recentActivity ?? []).slice(0, 5).map((a, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={[styles.dot, { backgroundColor: a.statusCode < 300 ? theme.colors.success : theme.colors.danger }]} />
            <Text style={styles.activityText} numberOfLines={1}>{a.userDisplayName} — {a.httpMethod} {a.path}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '47%', flexGrow: 1 },
  statValue: { fontSize: 28, fontWeight: '800', color: theme.colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  meetingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.borderLight },
  meetingTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  meetingDate: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary },
  empty: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});
