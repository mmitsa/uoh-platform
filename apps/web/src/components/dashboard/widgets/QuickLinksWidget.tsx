import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';
import { IconLink, IconPlus, IconTrash } from '../../icons';

interface QuickLink {
  title: string;
  url: string;
}

export default function QuickLinksWidget({ config, onConfigChange }: WidgetProps) {
  const { t } = useTranslation();
  const links = (config?.links as QuickLink[] | undefined) ?? [];
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const updateLinks = (updated: QuickLink[]) => {
    onConfigChange?.({ ...config, links: updated });
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const updated = [...links, { title: newTitle.trim(), url: newUrl.trim() }];
    updateLinks(updated);
    setNewTitle('');
    setNewUrl('');
  };

  const handleRemove = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    updateLinks(updated);
  };

  if (isEditing) {
    return (
      <div className="flex h-full flex-col gap-2">
        {/* Existing links with delete */}
        <ul className="space-y-1">
          {links.map((link, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5">
              <IconLink className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="flex-1 truncate text-xs text-neutral-700">{link.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-red-400 hover:text-red-600"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>

        {/* Add new link form */}
        <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-2">
          <input
            type="text"
            placeholder={t('dashboard.linkTitle', 'Link title')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
          />
          <input
            type="url"
            placeholder={t('dashboard.linkUrl', 'https://...')}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newUrl.trim()}
            className="flex items-center justify-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <IconPlus className="h-3 w-3" />
            {t('dashboard.addLink', 'Add Link')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="mt-auto self-end text-xs text-brand-600 hover:text-brand-700"
        >
          {t('common.done', 'Done')}
        </button>
      </div>
    );
  }

  // Display mode
  if (links.length === 0) {
    return (
      <div
        className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-neutral-400"
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
        }}
      >
        <IconLink className="h-6 w-6" />
        <p className="text-sm">{t('dashboard.clickToAddLinks', 'Click to add links')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-1">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-brand-600 hover:bg-brand-50 hover:text-brand-700"
            >
              <IconLink className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.title}</span>
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="mt-2 self-end text-xs text-neutral-400 hover:text-neutral-600"
      >
        {t('common.edit', 'Edit')}
      </button>
    </div>
  );
}
