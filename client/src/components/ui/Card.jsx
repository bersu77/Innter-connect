// Card — design-system v2 surface.
// Default = raised + 1px hairline + shadow-1. `elevated` bumps to shadow-3.
// `glass` swaps to a translucent fill with backdrop-blur for shells & scrims.

export default function Card({
  glass = false,
  elevated = false,
  className = '',
  children,
  ...props
}) {
  const cls = [
    glass ? 'card-glass' : 'card-base',
    !glass && elevated && 'card-elevated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
