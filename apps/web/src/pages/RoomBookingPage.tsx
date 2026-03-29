import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { Card, CardBody, Badge, Button } from '../components/ui';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconVideo } from '../components/icons';

/* ─── Types ─── */

type RoomBooking = {
  id: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: string;
  meetingRoomId: string;
};

type RoomWithBookings = {
  room: {
    id: string;
    nameAr: string;
    nameEn: string;
    building: string | null;
    floor: string | null;
    capacity: number;
    hasVideoConference: boolean;
    hasProjector: boolean;
  };
  bookings: RoomBooking[];
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM - 9 PM

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-neutral-200 text-neutral-700',
  Scheduled: 'bg-blue-100 text-blue-800',
  InProgress: 'bg-amber-100 text-amber-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
};

function getSunday(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function RoomBookingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { get } = useApi();

  const [weekStart, setWeekStart] = useState(() => getSunday(new Date()));
  const [data, setData] = useState<RoomWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const [buildingFilter, setBuildingFilter] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay());

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  const selectedDay = days[selectedDayIdx];

  const buildings = useMemo(
    () => [...new Set(data.map((d) => d.room.building).filter(Boolean))] as string[],
    [data],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      });
      if (buildingFilter) params.set('building', buildingFilter);
      const result = await get<RoomWithBookings[]>(`/api/v1/meeting-rooms/calendar?${params}`);
      setData(result);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [get, weekStart, weekEnd, buildingFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  function goToday() {
    setWeekStart(getSunday(new Date()));
    setSelectedDayIdx(new Date().getDay());
  }

  // Get bookings for a room on the selected day
  function getRoomDayBookings(bookings: RoomBooking[]) {
    const dayStart = new Date(selectedDay);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDay);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      const s = new Date(b.startDateTimeUtc);
      const e = new Date(b.endDateTimeUtc);
      return s < dayEnd && e > dayStart;
    });
  }

  // Calculate position and width of a booking block in the timeline
  function getBookingStyle(booking: RoomBooking) {
    const start = new Date(booking.startDateTimeUtc);
    const end = new Date(booking.endDateTimeUtc);
    const dayStart = new Date(selectedDay);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(selectedDay);
    dayEnd.setHours(22, 0, 0, 0);

    const clampedStart = start < dayStart ? dayStart : start;
    const clampedEnd = end > dayEnd ? dayEnd : end;

    const totalMinutes = 15 * 60; // 7 AM to 10 PM
    const startMinutes = (clampedStart.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (clampedEnd.getTime() - clampedStart.getTime()) / 60000;

    const left = Math.max(0, (startMinutes / totalMinutes) * 100);
    const width = Math.max(2, (durationMinutes / totalMinutes) * 100);

    return { left: `${left}%`, width: `${width}%` };
  }

  const dayNames = isAr
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (d: Date) =>
    d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('roomBooking.title')}</h1>
          <p className="text-sm text-neutral-500">{t('roomBooking.description')}</p>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3 p-3">
          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevWeek}>
              <IconChevronLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              {t('calendar.today')}
            </Button>
            <Button variant="ghost" size="sm" onClick={nextWeek}>
              <IconChevronRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Date range label */}
          <span className="text-sm font-medium text-neutral-700">
            {formatDate(weekStart)} – {formatDate(days[6])}
          </span>

          {/* Building filter */}
          {buildings.length > 0 && (
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-auto rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">{t('roomBooking.allBuildings')}</option>
              {buildings.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </CardBody>
      </Card>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((d, idx) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = idx === selectedDayIdx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDayIdx(idx)}
              className={[
                'flex flex-col items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors min-w-[60px]',
                isSelected
                  ? 'bg-brand-600 text-white'
                  : isToday
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
            >
              <span>{dayNames[idx]}</span>
              <span className="mt-0.5 text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline grid */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <IconCalendar className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-500">{t('roomBooking.noRooms')}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Hour labels */}
          <div className="flex ps-32">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-neutral-400">
                {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
              </div>
            ))}
          </div>

          {/* Room rows */}
          {data.map(({ room, bookings }) => {
            const dayBookings = getRoomDayBookings(bookings);
            return (
              <Card key={room.id} className="overflow-hidden">
                <div className="flex items-stretch">
                  {/* Room info */}
                  <div className="w-32 shrink-0 border-e border-neutral-100 p-2">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {isAr ? room.nameAr : room.nameEn}
                    </p>
                    {room.building && (
                      <p className="text-[10px] text-neutral-500 truncate">{room.building}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1">
                      <Badge variant="default" className="text-[9px] px-1 py-0">{room.capacity}</Badge>
                      {room.hasVideoConference && <IconVideo className="h-3 w-3 text-blue-500" />}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative flex-1 min-h-[48px] bg-neutral-50">
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 flex">
                      {HOURS.map((h) => (
                        <div key={h} className="flex-1 border-e border-neutral-100" />
                      ))}
                    </div>

                    {/* Booking blocks */}
                    {dayBookings.map((b) => {
                      const style = getBookingStyle(b);
                      const colorClass = STATUS_COLORS[b.status] || STATUS_COLORS.Scheduled;
                      return (
                        <div
                          key={b.id}
                          className={`absolute top-1 bottom-1 rounded ${colorClass} flex items-center px-1.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{ left: style.left, width: style.width }}
                          title={`${isAr ? b.titleAr : b.titleEn}\n${new Date(b.startDateTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endDateTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          <span className="text-[10px] font-medium truncate">
                            {isAr ? b.titleAr : b.titleEn}
                          </span>
                        </div>
                      );
                    })}

                    {/* Empty state for this room */}
                    {dayBookings.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-neutral-300">{t('roomBooking.available')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${color}`} />
            <span>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
