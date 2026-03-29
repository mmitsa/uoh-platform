import { useTranslation } from 'react-i18next';
import type { WidgetProps, UniversityRanking } from '../../../app/dashboard/types';
import { useApi } from '../../../hooks/useApi';
import { useAsyncData } from '../../../hooks/useAsyncData';

export default function UniversityRankingsWidget(_props: WidgetProps) {
  const { t } = useTranslation();
  const api = useApi();

  const { data, isLoading, isError } = useAsyncData<UniversityRanking[]>(
    () => api.get<UniversityRanking[]>('/api/v1/dashboard/rankings'),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noData', 'No data available')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
            <th className="pb-2 pe-2">{t('dashboard.source', 'Source')}</th>
            <th className="pb-2 pe-2 text-center">{t('dashboard.rank', 'Rank')}</th>
            <th className="pb-2 pe-2 text-center">{t('dashboard.change', 'Change')}</th>
            <th className="pb-2 text-center">{t('dashboard.year', 'Year')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.source} className="border-b border-neutral-50">
              <td className="py-2 pe-2 text-neutral-700">{r.source}</td>
              <td className="py-2 pe-2 text-center font-semibold text-neutral-900">{r.rank}</td>
              <td className="py-2 pe-2 text-center">
                {r.change > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-green-600">
                    <ArrowUp />+{r.change}
                  </span>
                )}
                {r.change < 0 && (
                  <span className="inline-flex items-center gap-0.5 text-red-500">
                    <ArrowDown />{r.change}
                  </span>
                )}
                {r.change === 0 && (
                  <span className="text-neutral-400">&mdash;</span>
                )}
              </td>
              <td className="py-2 text-center text-neutral-500">{r.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Inline arrow icons to avoid needing extra icon imports */
function ArrowUp() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
    </svg>
  );
}
