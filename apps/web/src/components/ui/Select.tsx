import { type SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...rest }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;
    const errId = `${selectId}-err`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? errId : undefined}
            className={[
              'w-full appearance-none rounded-md border bg-neutral-0 py-2 pe-10 ps-3 text-sm text-neutral-900 shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
              error ? 'border-danger' : 'border-neutral-300',
              className,
            ].join(' ')}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {error && <p id={errId} className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
