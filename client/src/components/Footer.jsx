// Public-site footer — v2 minimal sitemap on the bg-subtle surface.
// Three short link columns + the AAU project line + a privacy/terms row.
import { Link } from 'react-router-dom';
import Logo from './Logo';

const COLUMNS = [
  {
    heading: 'Product',
    links: ['Students', 'Companies', 'Universities', 'Admins'],
  },
  {
    heading: 'Resources',
    links: ['How it works', 'Trust & security', 'Reports'],
  },
  {
    heading: 'About',
    links: ['The team', 'Open-source', 'Contact'],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '56px var(--content-pad-x) 32px',
        }}
      >
        <div
          className="flex flex-col lg:flex-row"
          style={{ alignItems: 'flex-start', gap: 48 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to="/">
              <Logo />
            </Link>
            <p
              className="t-caption"
              style={{ marginTop: 12, maxWidth: 340, color: 'var(--text-tertiary)' }}
            >
              A final-year project at Addis Ababa University. Built for the institutions and
              students it serves.
            </p>
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
              gap: 56,
            }}
          >
            {COLUMNS.map(({ heading, links }) => (
              <div key={heading}>
                <span className="t-eyebrow">{heading}</span>
                <ul className="flex flex-col" style={{ gap: 8, marginTop: 10, padding: 0, listStyle: 'none' }}>
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="t-body-sm"
                        style={{
                          color: 'var(--text-secondary)',
                          borderBottom: 'none',
                        }}
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row"
          style={{
            marginTop: 32,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span className="t-caption">
            © {new Date().getFullYear()} InternConnect · AAU School of Information Technology &amp; Engineering
          </span>
          <span className="t-caption" style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <a href="#" style={{ color: 'inherit', borderBottom: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', borderBottom: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', borderBottom: 'none' }}>Status</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
