// Button — design-system v2 primitive.
// Variants: primary | secondary | ghost | danger.   Sizes: sm | md | lg.
// Extras: pill (full radius), leading/trailing slots, loading state.
import Spinner from './Spinner';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  pill = false,
  leading,
  trailing,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        pill && 'btn-pill',
        loading && 'is-loading',
        isDisabled && 'is-disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" tone="onBrand" />
      ) : (
        leading && <span className="inline-flex items-center">{leading}</span>
      )}
      {children}
      {trailing && <span className="inline-flex items-center">{trailing}</span>}
    </button>
  );
}
