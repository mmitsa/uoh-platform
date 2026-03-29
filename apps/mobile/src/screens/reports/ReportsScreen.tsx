import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type {
  CommitteeActivityReport,
  MeetingAttendanceReport,
  TaskPerformanceReport,
} from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Card, CardBody, DataList, LoadingSpinner, SegmentedControl } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

/* ---- Date helpers ---- */

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

/* ---- Sub-components ---- */

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/* ---- Committee Activity Tab ---- */

function CommitteeActivityTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const range = getDefaultDateRange();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-committee-activity', range.from, range.to],
    queryFn: () =>
      api.get<CommitteeActivityReport>(
        `/api/v1/reports/committee-activity?from=${range.from}&to=${range.to}`,
      ),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.summaryRow}>
        <SummaryCard
          icon="calendar"
          label={t('reports.totalMeetings')}
          value={data.totalMeetings}
          color={theme.colors.primary}
        />
        <SummaryCard
          icon="document-text"
          label={t('reports.totalDecisions')}
          value={data.totalDecisions}
          color={theme.colors.info}
        />
        <SummaryCard
          icon="checkmark-circle"
          label={t('reports.totalTasksCompleted')}
          value={data.totalTasksCompleted}
          color={theme.colors.success}
        />
      </View>

      <DataList
        data={data.rows}
        isLoading={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.committeeId}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{isAr ? item.nameAr : item.nameEn}</Text>
              <View style={styles.rowStats}>
                <View style={styles.rowStat}>
                  <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.rowStatText}>{item.meetingsCount}</Text>
                </View>
                <View style={styles.rowStat}>
                  <Ionicons name="document-text-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.rowStatText}>{item.decisionsCount}</Text>
                </View>
                <View style={styles.rowStat}>
                  <Ionicons name="checkmark-done-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.rowStatText}>{item.tasksCompletedCount}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

/* ---- Meeting Attendance Tab ---- */

function MeetingAttendanceTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-meeting-attendance'],
    queryFn: () => api.get<MeetingAttendanceReport>('/api/v1/reports/meeting-attendance'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  if (isLoading || !data) return <LoadingSpinner />;

  const rateColor = data.overallAttendanceRate >= 75
    ? theme.colors.success
    : data.overallAttendanceRate >= 50
      ? theme.colors.warning
      : theme.colors.danger;

  return (
    <View style={{ flex: 1 }}>
      <Card style={{ margin: 16, marginBottom: 0 }}>
        <CardBody>
          <Text style={styles.overallLabel}>{t('reports.overallAttendanceRate')}</Text>
          <Text style={[styles.overallValue, { color: rateColor }]}>
            {data.overallAttendanceRate.toFixed(1)}%
          </Text>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(data.overallAttendanceRate, 100)}%`, backgroundColor: rateColor },
              ]}
            />
          </View>
        </CardBody>
      </Card>

      <DataList
        data={data.rows}
        isLoading={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item) => item.meetingId}
        renderItem={({ item }) => {
          const itemColor = item.attendanceRate >= 75
            ? theme.colors.success
            : item.attendanceRate >= 50
              ? theme.colors.warning
              : theme.colors.danger;
          return (
            <View style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{isAr ? item.titleAr : item.titleEn}</Text>
                <Text style={styles.rowMeta}>
                  {new Date(item.startDateTimeUtc).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </Text>
                <View style={styles.rowStats}>
                  <Text style={styles.rowStatText}>
                    {t('reports.present')}: {item.totalPresent}/{item.totalInvited}
                  </Text>
                </View>
              </View>
              <Text style={[styles.rateText, { color: itemColor }]}>
                {item.attendanceRate.toFixed(0)}%
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ---- Task Performance Tab ---- */

function TaskPerformanceTab() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-task-performance'],
    queryFn: () => api.get<TaskPerformanceReport>('/api/v1/reports/task-performance'),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  if (isLoading || !data) return <LoadingSpinner />;

  const rateColor = data.overallCompletionRate >= 75
    ? theme.colors.success
    : data.overallCompletionRate >= 50
      ? theme.colors.warning
      : theme.colors.danger;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.summaryRow}>
        <SummaryCard
          icon="checkmark-circle"
          label={t('reports.overallCompletion')}
          value={Math.round(data.overallCompletionRate)}
          color={rateColor}
        />
        <SummaryCard
          icon="alert-circle"
          label={t('reports.totalOverdue')}
          value={data.totalOverdue}
          color={theme.colors.danger}
        />
      </View>

      <DataList
        data={data.rows}
        isLoading={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle={t('common.noData')}
        keyExtractor={(item, idx) => `${item.assignedToDisplayName}-${idx}`}
        renderItem={({ item }) => {
          const itemColor = item.completionRate >= 75
            ? theme.colors.success
            : item.completionRate >= 50
              ? theme.colors.warning
              : theme.colors.danger;
          return (
            <View style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.assignedToDisplayName}</Text>
                <View style={styles.rowStats}>
                  <Text style={styles.rowStatText}>
                    {t('reports.total')}: {item.totalTasks}
                  </Text>
                  <Text style={[styles.rowStatText, { color: theme.colors.success }]}>
                    {t('reports.completed')}: {item.completed}
                  </Text>
                  <Text style={[styles.rowStatText, { color: theme.colors.danger }]}>
                    {t('reports.overdue')}: {item.overdue}
                  </Text>
                </View>
              </View>
              <Text style={[styles.rateText, { color: itemColor }]}>
                {item.completionRate.toFixed(0)}%
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ---- Main Screen ---- */

export function ReportsScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [tab, setTab] = useState('committee');

  const segments = [
    { key: 'committee', label: t('reports.committeeActivity') },
    { key: 'attendance', label: t('reports.meetingAttendance') },
    { key: 'tasks', label: t('reports.taskPerformance') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('reports.title')}</Text>
      <SegmentedControl segments={segments} selected={tab} onSelect={setTab} />

      {tab === 'committee' && <CommitteeActivityTab />}
      {tab === 'attendance' && <MeetingAttendanceTab />}
      {tab === 'tasks' && <TaskPerformanceTab />}
    </View>
  );
}

/* ---- Styles ---- */

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    /* Summary cards */
    summaryRow: {
      flexDirection: 'row',
      gap: 8,
      padding: 16,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.sm,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
    summaryLabel: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },

    /* Overall rate */
    overallLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    overallValue: { fontSize: 32, fontWeight: '800', marginTop: 4 },
    progressBg: {
      height: 8,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 4,
      marginTop: 12,
    },
    progressFill: { height: 8, borderRadius: 4 },

    /* Row items */
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 14,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      gap: 12,
    },
    rowTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    rowMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    rowStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
    rowStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowStatText: { fontSize: 12, color: theme.colors.textMuted },
    rateText: { fontSize: 18, fontWeight: '800' },
  });
