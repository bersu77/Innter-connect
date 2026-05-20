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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <Card className="p-7 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send you reset instructions.
          </p>

          {sent ? (
            <div className="mt-5 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
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
                Send reset instructions
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </Card>
      </div>
    </div>
  );
}
