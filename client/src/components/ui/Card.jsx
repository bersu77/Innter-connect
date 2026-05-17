// Card — design-system surface.
// Flat white base, or subtle glassmorphism (translucent + backdrop blur).
// Soft 16px corners, gentle shadow, no heavy borders.

export default function Card({ glass = false, className = '', children, ...props }) {
  const surface = glass
    ? 'bg-white/70 backdrop-blur-glass ring-1 ring-white/50 shadow-glass'
    : 'bg-white ring-1 ring-slate-200/70 shadow-soft';

  return (
    <div className={`rounded-2xl ${surface} ${className}`} {...props}>
      {children}
    </div>
  );
}
