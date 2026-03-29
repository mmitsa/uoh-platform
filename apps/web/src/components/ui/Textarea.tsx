import { type TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const autoId = useId();
    const textareaId = id || autoId;
    const errId = `${textareaId}-err`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={[
            'rounded-md border bg-neutral-0 px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
            error ? 'border-danger' : 'border-neutral-300',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p id={errId} className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
