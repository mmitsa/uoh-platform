import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';
import { useApi } from '../../../hooks/useApi';
import { useAsyncData } from '../../../hooks/useAsyncData';

interface ExternalKpiData {
  [key: string]: unknown;
}

export default function ExternalKpiWidget({ config }: WidgetProps) {
  const { t } = useTranslation();
  const api = useApi();
  const sourceId = config?.sourceId as string | undefined;

  const { data, isLoading, isError } = useAsyncData<ExternalKpiData>(
    () => {
      if (!sourceId) return Promise.resolve({} as ExternalKpiData);
      return api.get<ExternalKpiData>(`/api/v1/dashboard/external-sources/${sourceId}/data`);
    },
    [sourceId],
  );

  if (!sourceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.configureDataSource', 'Configure data source')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-400">
        {t('dashboard.errorLoadingData', 'Error loading data')}
      </div>
    );
  }

  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined,
  );

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        {t('dashboard.noData', 'No data available')}
      </div>
    );
  }

  return (
    <dl className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline justify-between gap-2 rounded-md bg-neutral-50 px-3 py-2">
          <dt className="text-xs font-medium capitalize text-neutral-500">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </dt>
          <dd className="text-sm font-semibold text-neutral-800">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
