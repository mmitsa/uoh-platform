import { useTranslation } from 'react-i18next';

type Props = { message?: string; onRetry?: () => void };

export function ErrorAlert({ message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">
        {message ?? t('errors.generic')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
        >
          {t('actions.retry')}
        </button>
      )}
    </div>
  );
}
