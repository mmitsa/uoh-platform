import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui';
import { CalendarToolbar } from '../components/calendar/CalendarToolbar';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { CalendarEventModal } from '../components/calendar/CalendarEventModal';
import type { CalendarEvent } from '../components/calendar/types';

type Committee = { id: string; nameAr: string; nameEn: string };

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const api = useApi();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [committeeFilter, setCommitteeFilter] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate date range based on view
  const { from, to } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (view === 'month') {
      const start = new Date(y, m, 1);
      start.setDate(start.getDate() - start.getDay()); // start from Sunday
      const end = new Date(y, m + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay())); // end on Saturday
      return { from: start, to: end };
    }
    // Week view
    const dayOfWeek = currentDate.getDay();
    const start = new Date(y, m, currentDate.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: start, to: end };
  }, [currentDate, view]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      if (committeeFilter) params.set('committeeId', committeeFilter);
      const data = await api.get<CalendarEvent[]>(`/api/v1/meetings/calendar?${params}`);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [api, from, to, committeeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Load committees for filter
  useEffect(() => {
    api.get<{ items: Committee[] }>('/api/v1/committees?page=1&pageSize=100').then(res => setCommittees(res.items)).catch(() => {});
  }, [api]);

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const title = useMemo(() => {
    if (view === 'month') {
      return currentDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
    }
    const weekStart = new Date(from);
    const weekEnd = new Date(to);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const locale = isAr ? 'ar-SA' : 'en-US';
    return `${weekStart.toLocaleDateString(locale, opts)} – ${weekEnd.toLocaleDateString(locale, { ...opts, year: 'numeric' })}`;
  }, [currentDate, view, from, to, isAr]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">{t('calendar.title')}</h1>

      <Card>
        <div className="p-4">
          <CalendarToolbar
            title={title}
            view={view}
            onViewChange={setView}
            onPrev={goPrev}
            onNext={goNext}
            onToday={goToday}
            committees={committees}
            committeeFilter={committeeFilter}
            onCommitteeFilterChange={setCommitteeFilter}
          />
        </div>
        <div className="border-t border-neutral-200 p-4">
          <CalendarGrid
            currentDate={currentDate}
            view={view}
            events={events}
            from={from}
            to={to}
            loading={loading}
            onEventClick={setSelectedEvent}
          />
        </div>
      </Card>

      {selectedEvent && (
        <CalendarEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
