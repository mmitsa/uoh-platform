import type React from 'react';
import { IconCheckCircle, IconInfo, IconAlertTriangle, IconXCircle, IconX } from '../icons';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const config: Record<AlertVariant, { bg: string; icon: React.FC<{ className?: string }> }> = {
  info: { bg: 'bg-info-50 text-blue-800 border-blue-200', icon: IconInfo },
  success: { bg: 'bg-success-50 text-green-800 border-green-200', icon: IconCheckCircle },
  warning: { bg: 'bg-warning-50 text-amber-800 border-amber-200', icon: IconAlertTriangle },
  danger: { bg: 'bg-danger-50 text-red-800 border-red-200', icon: IconXCircle },
};

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', children, dismissible, onDismiss, className = '' }: AlertProps) {
  const { bg, icon: Icon } = config[variant];
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${bg} ${className}`} role="alert">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">{children}</div>
      {dismissible && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <IconX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
