// Public-site top nav — v2 sticky glass bar. Brand mark + three role anchors +
// sign-in / Get-started actions. Mobile collapses to a sheet under the bar.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import Button from './ui/Button';

const NAV_LINKS = [
  { label: 'For students',     href: '#for-students' },
  { label: 'For companies',    href: '#for-companies' },
  { label: 'For universities', href: '#for-universities' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: 'color-mix(in srgb, var(--bg-paper) 78%, transparent)',
        backdropFilter: 'blur(var(--blur-md)) saturate(140%)',
        WebkitBackdropFilter: 'blur(var(--blur-md)) saturate(140%)',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'border-color var(--dur-base) var(--ease-emphasis)',
      }}
    >
      <div
        className="mx-auto flex items-center"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '14px var(--content-pad-x)',
          gap: 22,
        }}
      >
        <Link to="/" className="flex-shrink-0">
          <Logo size="sm" />
        </Link>

        <div className="hidden lg:flex items-center" style={{ gap: 22, marginLeft: 22 }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="t-body-sm"
              style={{
                color: 'var(--text-secondary)',
                borderBottom: '1px solid transparent',
                transition: 'color var(--dur-fast) var(--ease-emphasis)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center" style={{ marginLeft: 'auto', gap: 8 }}>
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" pill>Get started</Button>
          </Link>
        </div>

        <button
          className="lg:hidden btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto', width: 36, padding: 0 }}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="lg:hidden"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-raised)',
            padding: '16px var(--content-pad-x) 22px',
          }}
        >
          <div className="flex flex-col" style={{ gap: 2, marginBottom: 14 }}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="nav-item"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex" style={{ gap: 10 }}>
            <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" size="md" className="w-full">Sign in</Button>
            </Link>
            <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button variant="primary" size="md" pill className="w-full">Get started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
