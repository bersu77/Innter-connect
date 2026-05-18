// DashboardHome — role-aware landing page with live summary stats (UC019).
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import { Card, Spinner } from '../../components/ui';

const STAT_LABELS = {
  student: {
    applications: 'Applications',
    pending: 'In progress',
    offers: 'Offers received',
    placements: 'Placements',
  },
  company: {
    internships: 'Internships',
    activeInternships: 'Active postings',
    applications: 'Applications',
    toReview: 'Awaiting review',
    placements: 'Placements',
  },
  university: {
    students: 'Registered students',
    verifiedStudents: 'Verified students',
    pendingStudents: 'Pending verification',
    placements: 'Placements',
  },
  admin: {
    users: 'Total users',
    companies: 'Companies',
    universities: 'Universities',
    internships: 'Internships',
    applications: 'Applications',
    pendingOrganizations: 'Pending verifications',
  },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const role = data?.role || user?.userType || user?.role || 'student';
  const labels = STAT_LABELS[role] || {};
  const stats = data?.stats || {};
  const firstName = user?.firstName || 'there';
  const entries = Object.entries(stats).filter(([key]) => labels[key]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your {role} workspace at a glance.
          {data?.unread > 0
            ? ` You have ${data.unread} unread notification${data.unread > 1 ? 's' : ''}.`
            : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(([key, value]) => (
              <Card key={key} className="p-5">
                <p className="text-sm text-slate-500">{labels[key]}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
              </Card>
            ))}
            {entries.length === 0 && (
              <Card glass className="p-6 sm:col-span-2 lg:col-span-3">
                <h2 className="text-base font-semibold">Complete your profile</h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Set up your profile to start using InternConnect.
                </p>
              </Card>
            )}
          </div>

          <Card glass className="p-6">
            <h2 className="text-base font-semibold">Getting around</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Use the sidebar to manage internships, applications, placements, and more. The bell
              in the top bar shows your latest notifications.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
