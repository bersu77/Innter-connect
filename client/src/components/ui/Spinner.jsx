// Spinner — design-system v2 two-tone arc.
// Sizes: sm (14) · md (18, default) · lg (28).
// `tone="onBrand"` flips the colour to current text colour (use inside primary buttons).

const SIZE_PX = { sm: 14, md: 18, lg: 28 };

export default function Spinner({ size = 'md', tone = 'brand', className = '' }) {
  const px = SIZE_PX[size] ?? SIZE_PX.md;
  const onBrand = tone === 'onBrand';
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`spinner ${className}`}
      style={{
        width: px,
        height: px,
        borderWidth: size === 'lg' ? 2 : 1.6,
        ...(onBrand
          ? {
              borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
              borderTopColor: 'currentColor',
            }
          : null),
      }}
    />
  );
}
