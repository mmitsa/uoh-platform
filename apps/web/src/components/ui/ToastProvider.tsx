import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { IconCheckCircle, IconXCircle, IconInfo, IconX } from '../icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const icons: Record<ToastType, React.FC<{ className?: string }>> = {
  success: IconCheckCircle,
  error: IconXCircle,
  info: IconInfo,
};

const bgClasses: Record<ToastType, string> = {
  success: 'bg-green-800',
  error: 'bg-red-800',
  info: 'bg-neutral-800',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const error = useCallback((msg: string) => addToast('error', msg), [addToast]);
  const info = useCallback((msg: string) => addToast('info', msg), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${bgClasses[t.type]} animate-in slide-in-from-end`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
                <IconX className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
