import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import { WidgetShell } from './WidgetShell';

export function DashboardGrid() {
  const { widgets, stats, isEditMode, removeWidget, updateWidgetConfig, dispatch } =
    useDashboard();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...widgets];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      dispatch({ type: 'REORDER_WIDGETS', payload: reordered });
    },
    [widgets, dispatch],
  );

  const sortableIds = widgets.map((w) => w.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
        <div
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {widgets.map((placement) => (
            <WidgetShell
              key={placement.id}
              placement={placement}
              stats={stats}
              isEditMode={isEditMode}
              onRemove={() => removeWidget(placement.id)}
              onConfigChange={(config) =>
                updateWidgetConfig(placement.id, config)
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default DashboardGrid;
