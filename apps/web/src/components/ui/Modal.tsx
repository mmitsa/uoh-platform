import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '../icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`w-full max-w-lg rounded-xl bg-neutral-0 shadow-lg animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header - always show close button */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 sm:px-5 py-3 sm:py-4 shrink-0">
          {title ? (
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 truncate ltr:pr-2 rtl:pl-2">{title}</h2>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        {/* Content - scrollable */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
