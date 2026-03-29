import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errId = `${inputId}-err`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errId : hint ? hintId : undefined}
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
        {hint && !error && <p id={hintId} className="text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
