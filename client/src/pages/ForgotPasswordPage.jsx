import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import client from '../api/client';
import { Button, Card, Input } from '../components/ui';
import Logo from '../components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setSent(true);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-paper)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <Card style={{ padding: 32 }}>
          <span className="t-eyebrow">Forgot password</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              lineHeight: 1.05,
              letterSpacing: '-0.015em',
              margin: '6px 0 0',
              fontWeight: 400,
            }}
          >
            Reset your password.
          </h1>
          <p className="t-body-md" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            Enter your email and we&apos;ll send you reset instructions.
          </p>

          {sent ? (
            <div
              className="mt-5"
              style={{
                background: 'var(--brand-50)',
                color: 'var(--brand-700)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                label="Email"
                type="email"
                required
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" loading={loading} className="w-full">
                {loading ? 'Sending…' : 'Send reset instructions'}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-7 inline-flex items-center t-mono"
            style={{ fontSize: 12, color: 'var(--brand-600)', gap: 6, borderBottom: 'none' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </Card>
      </div>
    </div>
  );
}
