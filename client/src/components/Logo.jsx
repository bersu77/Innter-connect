import { GraduationCap } from 'lucide-react';

// InternConnect wordmark — icon tile + name, single blue accent.
export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        <span className="text-brand-600">Intern</span>Connect
      </span>
    </span>
  );
}
