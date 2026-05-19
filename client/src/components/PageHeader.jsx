// PageHeader — design-system v2 page-hero pattern.
// One eyebrow + a serif display-lg title + an optional one-sentence lede + an
// optional right-aligned actions slot. Used by every dashboard archetype.

export default function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  meta,
}) {
  return (
    <header className="flex flex-wrap items-end" style={{ gap: 16, marginBottom: 24 }}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        {(eyebrow || meta) && (
          <div className="flex items-baseline" style={{ gap: 12, marginBottom: 4 }}>
            {eyebrow && <span className="t-eyebrow">{eyebrow}</span>}
            {meta && (
              <span
                className="t-mono"
                style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}
              >
                {meta}
              </span>
            )}
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 44px)',
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            margin: 0,
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        {lede && (
          <p
            className="t-body-lg"
            style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: '60ch' }}
          >
            {lede}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
          {actions}
        </div>
      )}
    </header>
  );
}
