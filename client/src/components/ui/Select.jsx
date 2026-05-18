// Select — design-system form control. Matches Input styling.
import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  { label, error, hint, children, className = '', id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={[
            'h-11 w-full appearance-none rounded-xl bg-white pl-3.5 pr-9 text-sm text-slate-900',
            'ring-1 transition-all duration-200 ease-out focus:outline-none focus:ring-2',
            error ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-brand-500',
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
