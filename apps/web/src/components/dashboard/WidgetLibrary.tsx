import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import { Button } from '../ui';
import { IconX, IconPlus, IconCheck, IconSearch } from '../icons';
import type { WidgetCategory } from '../../app/dashboard/types';

const CATEGORY_ORDER: WidgetCategory[] = [
  'Statistics',
  'Chart',
  'Committee',
  'Rankings',
  'External',
  'Custom',
];

export function WidgetLibrary() {
  const { t, i18n } = useTranslation();
  const { availableWidgets, widgets, isLibraryOpen, addWidget, toggleLibrary } =
    useDashboard();
  const [search, setSearch] = useState('');

  const isAr = i18n.language === 'ar';

  const placedKeys = useMemo(
    () => new Set(widgets.map((w) => w.widgetKey)),
    [widgets],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return availableWidgets;
    const q = search.toLowerCase();
    return availableWidgets.filter(
      (w) =>
        w.nameEn.toLowerCase().includes(q) ||
        w.nameAr.includes(q) ||
        (w.descriptionEn && w.descriptionEn.toLowerCase().includes(q)) ||
        (w.descriptionAr && w.descriptionAr.includes(q)),
    );
  }, [availableWidgets, search]);

  const grouped = useMemo(() => {
    const map = new Map<WidgetCategory, typeof filtered>();
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter((w) => w.category === cat);
      if (items.length > 0) {
        map.set(cat, items);
      }
    }
    return map;
  }, [filtered]);

  return (
    <>
      {/* Backdrop */}
      {isLibraryOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={toggleLibrary}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={[
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-neutral-0 shadow-xl',
          'transition-transform duration-300 ease-in-out',
          isLibraryOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {t('dashboard.widgetLibrary', 'Widget Library')}
          </h2>
          <button
            type="button"
            onClick={toggleLibrary}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-neutral-200 px-5 py-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.searchWidgets', 'Search widgets...')}
              className="w-full rounded-md border border-neutral-300 bg-neutral-0 py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {grouped.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconSearch className="mb-2 h-8 w-8" />
              <p className="text-sm">
                {t('dashboard.noWidgetsFound', 'No widgets found')}
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t(
                    `dashboard.categories.${category}`,
                    category,
                  )}
                </h3>
                <div className="space-y-2">
                  {items.map((widget) => {
                    const isPlaced = placedKeys.has(widget.key);
                    const name = isAr ? widget.nameAr : widget.nameEn;
                    const description = isAr
                      ? widget.descriptionAr
                      : widget.descriptionEn;

                    return (
                      <div
                        key={widget.key}
                        className={[
                          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                          isPlaced
                            ? 'border-neutral-100 bg-neutral-50 opacity-60'
                            : 'border-neutral-200 bg-neutral-0 hover:border-brand-200 hover:bg-brand-50/30',
                        ].join(' ')}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800">
                            {name}
                          </p>
                          {description && (
                            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">
                              {description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isPlaced ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              <IconCheck className="h-3.5 w-3.5" />
                              {t('dashboard.added', 'Added')}
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<IconPlus className="h-3.5 w-3.5" />}
                              onClick={() => addWidget(widget.key)}
                            >
                              {t('dashboard.add', 'Add')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default WidgetLibrary;
