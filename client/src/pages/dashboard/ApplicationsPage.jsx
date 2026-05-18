import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applicationApi } from '../../api/applications';
import { Badge, Button, Card, Spinner } from '../../components/ui';

const STATUS_TONE = {
  submitted: 'neutral',
  under_review: 'brand',
  shortlisted: 'warning',
  offered: 'brand',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};
const label = (s) => (s || '').replace(/_/g, ' ');

// Company review actions available at each application status.
const NEXT_ACTIONS = {
  submitted: [
    { status: 'under_review', label: 'Start review', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'secondary' },
  ],
  under_review: [
    { status: 'shortlisted', label: 'Shortlist', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'secondary' },
  ],
  shortlisted: [
    { status: 'offered', label: 'Send offer', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'secondary' },
  ],
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const isCompany = (user?.userType ?? user?.role) === 'company';

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { applications } = await applicationApi.list();
      setApps(applications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id, status) {
    setBusyId(id);
    setError('');
    try {
      await applicationApi.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isCompany ? 'Applications received' : 'My applications'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isCompany
            ? 'Review, shortlist, and decide on applications to your internships.'
            : 'Track the status of every internship you have applied to.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : apps.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          {isCompany ? 'No applications received yet.' : 'You have not applied to any internships yet.'}
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {isCompany ? (
                    <>
                      <div className="font-semibold text-slate-800">
                        {app.studentId?.userId?.firstName} {app.studentId?.userId?.lastName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {app.internshipId?.title}
                        {app.studentId?.major ? ` · ${app.studentId.major}` : ''}
                        {app.studentId?.gpa != null ? ` · GPA ${app.studentId.gpa}` : ''}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-slate-800">
                        {app.internshipId?.title || 'Internship'}
                      </div>
                      <div className="text-sm text-slate-500">
                        {app.internshipId?.companyId?.name || ''}
                      </div>
                    </>
                  )}
                </div>
                <Badge tone={STATUS_TONE[app.status]}>{label(app.status)}</Badge>
              </div>

              {app.coverLetter && (
                <p className="mt-3 line-clamp-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                  {app.coverLetter}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  Submitted {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                </span>
                {isCompany && NEXT_ACTIONS[app.status] && (
                  <div className="flex gap-2">
                    {NEXT_ACTIONS[app.status].map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant}
                        loading={busyId === app._id}
                        onClick={() => changeStatus(app._id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
