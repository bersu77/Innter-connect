// Badge — design-system v2 status pill.
// Tones map onto application/lifecycle status (see components.jsx in the spec).
// `dot` adds a 6px dot in the current colour at the leading edge.

const TONE_ALIASES = {
  emerald: 'success',
  red: 'danger',
  yellow: 'warning',
  blue: 'brand',
};

export default function Badge({
  tone = 'neutral',
  dot = false,
  className = '',
  children,
}) {
  const resolved = TONE_ALIASES[tone] || tone;
  return (
    <span className={`badge badge-${resolved} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
