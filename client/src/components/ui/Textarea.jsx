// Textarea — design-system multi-line input.
import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', id, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const taId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={taId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        ref={ref}
        rows={rows}
        className={[
          'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
          'ring-1 transition-all duration-200 ease-out focus:outline-none focus:ring-2',
          error ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-brand-500',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
