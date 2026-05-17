// DashboardHome — role-aware landing page inside the dashboard shell.
// Phase 0 ships placeholders; later phases (3, 10) replace each role's view
// with live data. The role switch here is the seam those phases plug into.
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui';

const roleConfig = {
  student: {
    title: 'Student',
    stats: [
      { label: 'Active internships', value: '0' },
      { label: 'Pending applications', value: '0' },
      { label: 'Notifications', value: '0' },
    ],
  },
  company: {
    title: 'Company',
    stats: [
      { label: 'Open postings', value: '0' },
      { label: 'Applications to review', value: '0' },
      { label: 'Interns hired', value: '0' },
    ],
  },
  university: {
    title: 'University',
    stats: [
      { label: 'Registered students', value: '0' },
      { label: 'Active placements', value: '0' },
      { label: 'Pending verifications', value: '0' },
    ],
  },
  admin: {
    title: 'Administrator',
    stats: [
      { label: 'Total users', value: '0' },
      { label: 'Pending approvals', value: '0' },
      { label: 'System alerts', value: '0' },
    ],
  },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const role = user?.userType ?? user?.role ?? 'student';
  const config = roleConfig[role] ?? roleConfig.student;
  const firstName = user?.firstName || 'there';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your {config.title.toLowerCase()} workspace — live data arrives as each module ships.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card glass className="p-6">
        <h2 className="text-base font-semibold">Getting started</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          The app shell, design system, and routing are in place. Profiles, internships,
          applications, and the rest of the workspace are delivered module by module.
        </p>
      </Card>
    </div>
  );
}
