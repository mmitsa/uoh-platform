export interface CalendarEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: string;
  type: string;
  eventKind: 'meeting' | 'committee';
  committeeId: string | null;
  committeeNameAr: string | null;
  committeeNameEn: string | null;
  location: string | null;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  Scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  InProgress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export const COMMITTEE_COLOR = { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
