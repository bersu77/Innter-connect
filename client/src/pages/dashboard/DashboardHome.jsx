// DashboardHome — design-system v2 arrival page.
// Eyebrow + serif greeting + role-aware stat grid + a getting-around note.
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
  supervisor: {
    interns: 'Assigned interns',
    activeInterns: 'Active interns',
    tasksAssigned: 'Tasks assigned',
    tasksToGrade: 'Tasks to grade',
    assessments: 'Assessments',
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

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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

  const now = new Date();
  const datestamp = `${WEEKDAY[now.getDay()]} · ${MONTH[now.getMonth()]} ${now.getDate()}`;
  const unread = data?.unread || 0;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <header>
        <span className="t-eyebrow">{datestamp}</span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 6vw, 48px)',
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            margin: '6px 0 0',
            fontWeight: 400,
            wordBreak: 'break-word',
          }}
        >
          Welcome back,{' '}
          <span style={{ fontStyle: 'italic' }}>{firstName}</span>
          <span style={{ color: 'var(--text-tertiary)' }}> —</span>
        </h1>
        <p
          className="t-body-lg"
          style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: 560 }}
        >
          Your {role} workspace at a glance.
          {unread > 0
            ? ` You have ${unread} unread notification${unread > 1 ? 's' : ''}.`
            : ''}
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {entries.length === 0 ? (
              <Card glass style={{ padding: 22, gridColumn: '1 / -1' }}>
                <span className="t-eyebrow">Getting started</span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    lineHeight: 1.05,
                    letterSpacing: '-0.015em',
                    margin: '6px 0 0',
                    fontWeight: 400,
                  }}
                >
                  Complete your profile.
                </h2>
                <p className="t-body-md" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                  Set up your profile to start using InternConnect.
                </p>
              </Card>
            ) : (
              entries.map(([key, value]) => (
                <Card key={key} style={{ padding: 'clamp(14px, 3vw, 18px)' }}>
                  <span className="t-eyebrow">{labels[key]}</span>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(32px, 6vw, 44px)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      fontWeight: 400,
                      marginTop: 8,
                    }}
                  >
                    {value}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Getting-around card */}
          <Card style={{ padding: 22 }}>
            <span className="t-eyebrow">Getting around</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                margin: '6px 0 0',
                fontWeight: 400,
              }}
            >
              The sidebar runs your workspace.
            </h2>
            <p
              className="t-body-md"
              style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: 640 }}
            >
              Internships, applications, placements, tasks — everything lives on the left. The
              bell up top surfaces what just happened; the avatar opens your account.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
