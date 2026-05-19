import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components/ui';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          <span className="t-eyebrow">Sign in</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              margin: '6px 0 0',
              fontWeight: 400,
            }}
          >
            Welcome back.
          </h1>
          <p className="t-body-md" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            Sign in to your InternConnect workspace.
          </p>

          {error && (
            <div
              className="mt-5"
              role="alert"
              style={{
                background: 'var(--danger-50)',
                color: 'var(--danger-700)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              label="Email or username"
              type="text"
              required
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or username"
            />
            <div>
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                required
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer' }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="t-mono"
                  style={{ fontSize: 12, color: 'var(--brand-600)' }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Signing in…' : 'Log in'}
            </Button>
          </form>

          <p
            className="mt-7 text-center t-body-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--brand-600)', borderBottom: 'none', fontWeight: 500 }}
            >
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
