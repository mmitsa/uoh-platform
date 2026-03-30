import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, I18nManager, Pressable, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { CalendarEvent } from '../../api/types';
import { theme } from '../../ui/theme';
import type { Theme } from '../../ui/theme';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../../components/ui';
import { useRefreshControl } from '../../hooks/useRefreshControl';

const STATUS_COLORS: Record<string, string> = {
  Draft: theme.colors.textMuted,
  Scheduled: theme.colors.info,
  InProgress: theme.colors.warning,
  Completed: theme.colors.success,
  Cancelled: theme.colors.danger,
};

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Month range
  const { from, to, days } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const start = new Date(y, m, 1);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(y, m + 1, 0);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const result: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return { from: start, to: end, days: result };
  }, [currentDate]);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar', from.toISOString(), to.toISOString()],
    queryFn: () => api.get<CalendarEvent[]>(`/api/v1/meetings/calendar?from=${from.toISOString()}&to=${to.toISOString()}`),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  // Events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const start = new Date(ev.startDateTimeUtc);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // Selected date events
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedEvents = eventsByDate.get(selectedKey) || [];

  const goPrev = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const monthLabel = currentDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  const renderEvent = useCallback(({ item }: { item: CalendarEvent }) => {
    const start = new Date(item.startDateTimeUtc);
    const end = new Date(item.endDateTimeUtc);
    const locale = isAr ? 'ar-SA' : 'en-US';
    const color = item.eventKind === 'committee' ? theme.colors.primary : (STATUS_COLORS[item.status] || theme.colors.textMuted);

    return (
      <Pressable
        style={styles.eventItem}
        onPress={() => {
          if (item.eventKind === 'meeting') {
            navigation.navigate('MeetingsTab', { screen: 'MeetingDetail', params: { id: item.id } });
          }
        }}
      >
        <View style={[styles.eventDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{isAr ? item.titleAr : item.titleEn}</Text>
          <Text style={styles.eventTime}>
            {item.eventKind === 'committee'
              ? t('calendar.allDay')
              : `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`}
          </Text>
          {item.location && (
            <Text style={styles.eventLocation}>{item.location}</Text>
          )}
        </View>
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.colors.textMuted} />
      </Pressable>
    );
  }, [isAr, t, navigation]);

  const today = new Date();

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <Pressable onPress={goPrev} style={styles.navBtn}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goNext} style={styles.navBtn}>
          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayName}>{name}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const hasEvents = eventsByDate.has(dateKey);

          return (
            <Pressable
              key={i}
              style={[styles.dayCell, isSelected && styles.selectedDay]}
              onPress={() => setSelectedDate(day)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !isCurrentMonth && { color: theme.colors.textMuted, opacity: 0.4 },
                  isToday && styles.todayText,
                  isSelected && styles.selectedText,
                ]}
              >
                {day.getDate()}
              </Text>
              {hasEvents && (
                <View style={styles.dotsRow}>
                  {(eventsByDate.get(dateKey) || []).slice(0, 3).map((ev, j) => (
                    <View
                      key={j}
                      style={[
                        styles.miniDot,
                        { backgroundColor: ev.eventKind === 'committee' ? theme.colors.primary : (STATUS_COLORS[ev.status] || theme.colors.textMuted) },
                      ]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Agenda list */}
      <View style={styles.agendaHeader}>
        <Text style={styles.agendaTitle}>
          {selectedDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={selectedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('calendar.noEvents')}</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  dayNamesRow: { flexDirection: 'row', paddingHorizontal: 8 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, paddingVertical: 4 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  selectedDay: { backgroundColor: theme.colors.primaryLight || theme.colors.primary + '20' },
  dayNumber: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  todayText: { fontWeight: '800', color: theme.colors.primary },
  selectedText: { fontWeight: '800', color: theme.colors.primary },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  miniDot: { width: 4, height: 4, borderRadius: 2 },
  agendaHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  agendaTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  eventItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 12 },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  eventTime: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  eventLocation: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, paddingVertical: 32, fontSize: 14 },
});
