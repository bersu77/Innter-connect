// Input — design-system form control.
// Soft rounded corners, subtle ring (no heavy border), smooth focus transition.
// Optional leading icon and trailing element (e.g. password visibility toggle).
import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, trailing, className = '', id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={[
            'h-11 w-full rounded-xl bg-white text-sm text-slate-900 placeholder:text-slate-400',
            'ring-1 transition-all duration-200 ease-out focus:outline-none focus:ring-2',
            Icon ? 'pl-9' : 'pl-3.5',
            trailing ? 'pr-10' : 'pr-3.5',
            error ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-brand-500',
          ].join(' ')}
          {...props}
        />
        {trailing && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
