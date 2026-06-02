import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--bg-paper)' }}
    >
      <Logo />
      <div
        className="mt-12"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(64px, 10vw, 120px)',
          lineHeight: 1,
          letterSpacing: '-0.025em',
          color: 'var(--brand-500)',
          fontStyle: 'italic',
        }}
      >
        404
      </div>
      <span className="t-eyebrow" style={{ marginTop: 12 }}>
        Lost the thread
      </span>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 6vw, 32px)',
          lineHeight: 1.05,
          letterSpacing: '-0.015em',
          margin: '8px 0 0',
          fontWeight: 400,
        }}
      >
        This page isn&apos;t here.
      </h1>
      <p
        className="t-body-md"
        style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: '40ch' }}
      >
        It may have moved, or never existed. Either way — let&apos;s get you back.
      </p>
      <Link to="/" className="mt-8">
        <Button trailing={<ArrowRight size={16} strokeWidth={1.8} />}>Back to home</Button>
      </Link>
    </div>
  );
}
