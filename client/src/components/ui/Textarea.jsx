// Textarea — design-system v2 multi-line input.
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
        <label
          htmlFor={taId}
          className="mb-1.5 block text-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={taId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className="textarea"
        {...props}
      />
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

export default Textarea;
