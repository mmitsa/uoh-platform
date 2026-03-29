import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { PALETTE_GROUPS } from '../constants/stepTypes';
import type { StepTypeDefinition } from '../types';

function DraggablePaletteItem({ item, isAr }: { item: StepTypeDefinition; isAr: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { type: 'palette-item', stepType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-grab active:cursor-grabbing transition-all',
        item.bgColor,
        item.borderColor,
        item.color,
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-sm',
      ].join(' ')}
    >
      <StepIcon type={item.type} />
      <span>{isAr ? item.labelAr : item.labelEn}</span>
    </div>
  );
}

function PaletteGroup({ label, items, isAr }: { groupKey: string; label: string; items: StepTypeDefinition[]; isAr: boolean }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-1.5 flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="space-y-1.5">
          {items.map(item => (
            <DraggablePaletteItem key={item.type} item={item} isAr={isAr} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StepPalette() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="w-56 shrink-0 overflow-y-auto border-e border-neutral-200 bg-neutral-50/50 p-3">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {isAr ? 'العناصر' : 'Elements'}
      </h3>
      {PALETTE_GROUPS.map(group => (
        <PaletteGroup
          key={group.key}
          groupKey={group.key}
          label={isAr ? group.labelAr : group.labelEn}
          items={group.items}
          isAr={isAr}
        />
      ))}
    </div>
  );
}

function StepIcon({ type }: { type: string }) {
  switch (type) {
    case 'initial':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6" /></svg>;
    case 'finalApproved':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
    case 'finalRejected':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>;
    case 'review':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>;
    case 'notify':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6z" clipRule="evenodd" /></svg>;
    case 'condition':
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1l9 9-9 9-9-9 9-9z" clipRule="evenodd" /></svg>;
    default:
      return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
  }
}
