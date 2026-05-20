// Input — design-system v2 form control.
// 44px tall, raised fill, hairline ring; focus grows the ring to brand + halo.
// Optional leading icon component and trailing slot.
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
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          className="input"
          style={{
            paddingLeft: Icon ? 40 : undefined,
            paddingRight: trailing ? 40 : undefined,
          }}
          {...props}
        />
        {trailing && (
          <div
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {trailing}
          </div>
        )}
      </div>
      {error ? (
        <p
          className="mt-1.5 text-caption"
          style={{ color: 'var(--danger-600)' }}
        >
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 t-caption">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
