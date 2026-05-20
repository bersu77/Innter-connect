// Select — design-system v2 form control. Matches Input.
// Chevron is drawn by the .select class (two diagonal CSS gradients).
import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  { label, error, hint, children, className = '', id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className="select"
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-caption" style={{ color: 'var(--danger-600)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 t-caption">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
