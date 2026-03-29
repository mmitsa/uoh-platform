import { useTranslation } from 'react-i18next';
import { IconChevronRight } from '../icons';

interface Props {
  title: string;
  view: 'month' | 'week';
  onViewChange: (v: 'month' | 'week') => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  committees: { id: string; nameAr: string; nameEn: string }[];
  committeeFilter: string;
  onCommitteeFilterChange: (id: string) => void;
}

export function CalendarToolbar({
  title, view, onViewChange, onPrev, onNext, onToday,
  committees, committeeFilter, onCommitteeFilterChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="rounded-md border border-neutral-300 p-1.5 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <IconChevronRight className={`h-4 w-4 ${isAr ? '' : 'rotate-180'}`} />
        </button>
        <button
          onClick={onNext}
          className="rounded-md border border-neutral-300 p-1.5 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <IconChevronRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={onToday}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          {t('calendar.today')}
        </button>
        <h2 className="text-lg font-semibold text-neutral-900 ms-2">{title}</h2>
      </div>

      {/* Right: view toggle + filter */}
      <div className="flex items-center gap-3">
        {/* Committee filter */}
        <select
          value={committeeFilter}
          onChange={(e) => onCommitteeFilterChange(e.target.value)}
          className="rounded-md border border-neutral-300 py-1.5 px-3 text-sm text-neutral-700 bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">{t('calendar.filterByCommittee')}</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {isAr ? c.nameAr : c.nameEn}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden">
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'month'
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-0 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {t('calendar.month')}
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-s border-neutral-300 ${
              view === 'week'
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-0 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {t('calendar.week')}
          </button>
        </div>
      </div>
    </div>
  );
}
