import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-6xl font-semibold tracking-tight text-brand-600">404</h1>
      <p className="mt-2 text-lg font-medium text-slate-800">Page not found</p>
      <p className="mt-1 text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
