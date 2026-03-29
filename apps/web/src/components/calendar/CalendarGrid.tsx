import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent } from './types';
import { STATUS_COLORS, COMMITTEE_COLOR } from './types';

interface Props {
  currentDate: Date;
  view: 'month' | 'week';
  events: CalendarEvent[];
  from: Date;
  to: Date;
  loading: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MAX_EVENTS_PER_CELL = 3;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

export function CalendarGrid({ currentDate, view, events, from, to, loading, onEventClick }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  // Build array of days
  const days = useMemo(() => {
    const result: Date[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [from, to]);

  // Map events to days
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const start = new Date(ev.startDateTimeUtc);
      const end = new Date(ev.endDateTimeUtc);
      // Spread event across all days it spans
      for (const day of days) {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        if (start < dayEnd && end > dayStart) {
          const key = dayStart.toISOString().slice(0, 10);
          const list = map.get(key) || [];
          list.push(ev);
          map.set(key, list);
        }
      }
    }
    return map;
  }, [events, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (view === 'month') {
    return (
      <div>
        {/* Header */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-t-lg overflow-hidden">
          {dayNames.map((name) => (
            <div key={name} className="bg-neutral-50 py-2 text-center text-xs font-semibold text-neutral-500 uppercase">
              {name}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-b-lg overflow-hidden">
          {days.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayEvents = eventsByDay.get(key) || [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const today = isToday(day);
            const overflow = dayEvents.length - MAX_EVENTS_PER_CELL;

            return (
              <div
                key={key}
                className={`min-h-[100px] bg-neutral-0 p-1.5 ${!isCurrentMonth ? 'bg-neutral-50/50' : ''}`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      today
                        ? 'bg-brand-600 text-white'
                        : isCurrentMonth
                          ? 'text-neutral-900'
                          : 'text-neutral-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, MAX_EVENTS_PER_CELL).map((ev) => {
                    const colors = ev.eventKind === 'committee'
                      ? COMMITTEE_COLOR
                      : (STATUS_COLORS[ev.status] || STATUS_COLORS.Draft);

                    return (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className={`w-full truncate rounded px-1.5 py-0.5 text-start text-[11px] font-medium transition-opacity hover:opacity-80 ${colors.bg} ${colors.text}`}
                        title={isAr ? ev.titleAr : ev.titleEn}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full me-1 ${colors.dot} ${
                          ev.status === 'InProgress' ? 'animate-pulse' : ''
                        }`} />
                        {isAr ? ev.titleAr : ev.titleEn}
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <div className="text-[10px] text-neutral-500 ps-1">
                      {t('calendar.moreEvents', { count: overflow })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week view
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-neutral-200 rounded-t-lg overflow-hidden">
        <div className="bg-neutral-50 py-2" />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`bg-neutral-50 py-2 text-center ${today ? 'bg-brand-50' : ''}`}
            >
              <div className="text-xs text-neutral-500">{dayNames[day.getDay()]}</div>
              <div className={`text-sm font-semibold ${today ? 'text-brand-600' : 'text-neutral-900'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-neutral-200 rounded-b-lg overflow-hidden max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="contents">
            {/* Time label */}
            <div className="bg-neutral-0 py-3 pe-2 text-end text-[11px] text-neutral-400">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {/* Cells */}
            {days.map((day, di) => {
              const key = day.toISOString().slice(0, 10);
              const dayEvents = eventsByDay.get(key) || [];
              const hourEvents = dayEvents.filter((ev) => {
                const h = new Date(ev.startDateTimeUtc).getHours();
                return h === hour;
              });

              return (
                <div
                  key={`${hour}-${di}`}
                  className={`bg-neutral-0 min-h-[48px] border-t border-neutral-100 p-0.5 ${isToday(day) ? 'bg-brand-50/30' : ''}`}
                >
                  {hourEvents.map((ev) => {
                    const colors = ev.eventKind === 'committee'
                      ? COMMITTEE_COLOR
                      : (STATUS_COLORS[ev.status] || STATUS_COLORS.Draft);

                    return (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className={`w-full truncate rounded px-1 py-0.5 text-start text-[10px] font-medium transition-opacity hover:opacity-80 ${colors.bg} ${colors.text}`}
                      >
                        {isAr ? ev.titleAr : ev.titleEn}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
