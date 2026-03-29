import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconFile } from '../icons';
import { formatFileSize, isImageType } from './helpers';

interface FilePreviewGridProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function FilePreviewGrid({ files, onRemove }: FilePreviewGridProps) {
  const { t } = useTranslation();

  const previews = useMemo(() => {
    return files.map((file) => ({
      name: file.name,
      size: file.size,
      isImage: isImageType(file.type),
      url: isImageType(file.type) ? URL.createObjectURL(file) : null,
    }));
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 py-2">
      <span className="w-full text-[11px] font-medium text-neutral-500">
        {t('chat.selectedFiles')} ({files.length})
      </span>
      {previews.map((preview, idx) => (
        <div
          key={idx}
          className="group relative flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5"
        >
          {preview.isImage && preview.url ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <IconFile className="h-5 w-5 shrink-0 text-neutral-400" />
          )}
          <div className="min-w-0 max-w-[120px]">
            <p className="truncate text-xs font-medium text-neutral-700">{preview.name}</p>
            <p className="text-[10px] text-neutral-400">{formatFileSize(preview.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="ms-1 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
          >
            <IconX className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
