import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui';
import { IconSearch } from '../components/icons';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <IconSearch className="h-10 w-10" />
      </div>
      <div>
        <div className="text-5xl font-bold text-neutral-300">404</div>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">{t('errors.notFound')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('errors.notFoundDesc')}</p>
      </div>
      <Link to="/">
        <Button>{t('actions.backHome')}</Button>
      </Link>
    </div>
  );
}
