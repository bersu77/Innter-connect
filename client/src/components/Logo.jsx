// InternConnect wordmark — v2. Editorial-serif name, brand-tinted "i" tile.
export default function Logo({ className = '', size = 'md' }) {
  const tilePx = size === 'sm' ? 24 : size === 'lg' ? 32 : 28;
  const fontPx = size === 'sm' ? 18 : size === 'lg' ? 24 : 22;
  const tileFont = size === 'sm' ? 14 : 15;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: tilePx,
          height: tilePx,
          borderRadius: 8,
          background: 'var(--brand-500)',
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: tileFont,
          lineHeight: 1,
        }}
      >
        i
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: fontPx,
          lineHeight: 1,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        InternConnect
      </span>
    </span>
  );
}
