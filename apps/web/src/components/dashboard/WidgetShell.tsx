import { Suspense } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { Card, CardBody } from '../ui';
import { IconGripVertical, IconX } from '../icons';
import { getWidgetComponent } from '../../app/dashboard/widgetRegistry';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import { Skeleton } from '../ui';
import type { WidgetPlacement, DashboardStats } from '../../app/dashboard/types';

interface WidgetShellProps {
  placement: WidgetPlacement;
  onRemove: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  stats: DashboardStats | null;
  isEditMode: boolean;
}

function WidgetFallback() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function WidgetShell({
  placement,
  onRemove,
  onConfigChange,
  stats,
  isEditMode,
}: WidgetShellProps) {
  const { i18n } = useTranslation();
  const { availableWidgets } = useDashboard();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: placement.id,
    disabled: !isEditMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${placement.w} / span ${placement.w}`,
    gridRow: `span ${placement.h} / span ${placement.h}`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const widgetDef = availableWidgets.find((w) => w.key === placement.widgetKey);
  const isAr = i18n.language === 'ar';
  const title = widgetDef
    ? isAr
      ? widgetDef.nameAr
      : widgetDef.nameEn
    : placement.widgetKey;

  const WidgetComponent = getWidgetComponent(placement.widgetKey);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={[
          'h-full flex flex-col',
          isEditMode ? 'border-dashed border-2 border-brand-300' : '',
          isDragging ? 'shadow-lg ring-2 ring-brand-500' : '',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {isEditMode && (
              <button
                type="button"
                className="cursor-grab touch-none text-neutral-400 hover:text-neutral-600 active:cursor-grabbing"
                aria-label="Drag to reorder"
                {...listeners}
              >
                <IconGripVertical className="h-4 w-4" />
              </button>
            )}
            <h3 className="truncate text-sm font-semibold text-neutral-800">
              {title}
            </h3>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Remove widget"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <CardBody className="flex-1 overflow-auto">
          {WidgetComponent ? (
            <Suspense fallback={<WidgetFallback />}>
              <WidgetComponent
                config={placement.config}
                onConfigChange={onConfigChange}
                dashboardStats={stats ?? undefined}
              />
            </Suspense>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              Widget not found: {placement.widgetKey}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default WidgetShell;
