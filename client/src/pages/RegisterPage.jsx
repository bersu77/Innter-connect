import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components/ui';
import Logo from '../components/Logo';

const TABS = [
  { id: 'student',    label: 'Student' },
  { id: 'university', label: 'University' },
  { id: 'company',    label: 'Company' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [userType, setUserType] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setError('Please enter your first and last name.');
      return;
    }
    if (
      userType === 'student' &&
      !/@[^@\s]+\.(edu|edu\.[a-z]{2}|ac\.[a-z]{2})$/i.test(email.trim())
    ) {
      setError(
        'Students must use an academic institutional email (e.g. a .edu or .edu.et university address) — personal email accounts are not accepted.',
      );
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email,
        password,
        userType,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        <Card style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
          <span className="t-eyebrow">Create your account</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 7vw, 36px)',
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              margin: '6px 0 0',
              fontWeight: 400,
            }}
          >
            Begin your{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--brand-500)' }}>career</span>.
          </h1>
          <p className="t-body-md" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            Pick the workspace that fits you.
          </p>

          {/* Role segmented control */}
          <div
            className="mt-5 grid grid-cols-3"
            style={{
              gap: 4,
              padding: 4,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
            }}
          >
            {TABS.map((tab) => {
              const active = userType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUserType(tab.id)}
                  className="t-ui-sm"
                  style={{
                    height: 34,
                    border: 0,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    background: active ? 'var(--bg-raised)' : 'transparent',
                    color: active ? 'var(--brand-700)' : 'var(--text-secondary)',
                    boxShadow: active ? 'var(--shadow-1)' : 'none',
                    transition: 'background-color var(--dur-fast) var(--ease-emphasis), color var(--dur-fast) var(--ease-emphasis)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

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
              label="Full name"
              required
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Abebe Kebede"
            />
            <Input
              label="Email"
              type="email"
              required
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={userType === 'student' ? 'you@university.edu.et' : 'you@example.com'}
              hint={
                userType === 'student'
                  ? 'Use your academic institutional email (e.g. a .edu or .edu.et university address).'
                  : undefined
              }
            />
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              required
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              hint="Use at least 8 characters."
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
            <Input
              label="Confirm password"
              type={showPw ? 'text' : 'password'}
              required
              icon={Lock}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
            />
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-7 text-center t-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--brand-600)', borderBottom: 'none', fontWeight: 500 }}
            >
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
