import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '../icons';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  // Track animation state to keep DOM mounted during exit animation
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => setAnimating(true));
    } else if (visible) {
      setAnimating(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(timer);
    }
  }, [open, visible]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-250',
          animating ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={[
          'fixed inset-y-0 start-0 z-50 w-72 shadow-2xl transition-transform duration-250 ease-out',
          animating
            ? 'translate-x-0 rtl:-translate-x-0'
            : 'ltr:-translate-x-full rtl:translate-x-full',
        ].join(' ')}
      >
        <Sidebar onMobileClose={onClose} />

        {/* Close button */}
        <button
          type="button"
          className={[
            'absolute top-3.5 end-3 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-150',
            animating ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={onClose}
          aria-label="Close menu"
        >
          <IconX className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
