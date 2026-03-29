import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function CustomNoteWidget({ config, onConfigChange }: WidgetProps) {
  const { t } = useTranslation();
  const content = (config?.content as string) ?? '';
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep draft in sync when config changes externally
  useEffect(() => {
    setDraft((config?.content as string) ?? '');
  }, [config?.content]);

  const persistChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onConfigChange?.({ ...config, content: value });
      }, 500);
    },
    [config, onConfigChange],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setDraft(value);
    persistChange(value);
  };

  if (isEditing) {
    return (
      <div className="flex h-full flex-col gap-2">
        <textarea
          className="flex-1 resize-none rounded-md border border-neutral-200 p-2 text-sm text-neutral-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('dashboard.writeNote', 'Write your note here...')}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="self-end rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
        >
          {t('common.done', 'Done')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-full cursor-pointer"
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
      }}
    >
      {content ? (
        <p className="whitespace-pre-wrap text-sm text-neutral-700">{content}</p>
      ) : (
        <p className="text-sm italic text-neutral-400">
          {t('dashboard.clickToAddNote', 'Click to add a note...')}
        </p>
      )}
    </div>
  );
}
