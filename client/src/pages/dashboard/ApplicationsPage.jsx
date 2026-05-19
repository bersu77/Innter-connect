import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applicationApi } from '../../api/applications';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

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
const COMPANY_ACTIONS = {
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
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const statusOptions = [...new Set(apps.map((a) => a.status).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const visible = apps.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (!query) return true;
    const name = a.studentId?.userId
      ? `${a.studentId.userId.firstName} ${a.studentId.userId.lastName}`
      : '';
    return [a.internshipId?.title, a.internshipId?.companyId?.name, name, a.studentId?.major]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

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

  async function run(id, fn) {
    setBusyId(id);
    setError('');
    try {
      await fn();
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
            : 'Track every internship you have applied to and respond to offers.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!loading && apps.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name, internship or company…"
          filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : apps.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          {isCompany ? 'No applications received yet.' : 'You have not applied to any internships yet.'}
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No applications match your filters.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((app) => (
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

              {app.attachments?.length > 0 && (
                <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <p className="text-xs font-medium text-slate-500">Attachments</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {app.attachments.map((a, i) => {
                      const href = a.link || a.path;
                      return href ? (
                        <a
                          key={i}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-brand-600 hover:underline"
                        >
                          📎 {a.label}
                        </a>
                      ) : (
                        <span key={i} className="text-sm text-slate-600">
                          • {a.label}
                          {a.detail ? ` (${a.detail})` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  Submitted {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                </span>

                {/* Company review actions — gated on university verification */}
                {isCompany && app.universityVerification?.status !== 'approved' && (
                  <span className="text-xs font-medium text-amber-700">
                    {app.universityVerification?.status === 'rejected'
                      ? 'University could not verify this student'
                      : 'Awaiting university verification'}
                  </span>
                )}
                {isCompany &&
                  app.universityVerification?.status === 'approved' &&
                  COMPANY_ACTIONS[app.status] && (
                    <div className="flex gap-2">
                      {COMPANY_ACTIONS[app.status].map((action) => (
                        <Button
                          key={action.status}
                          size="sm"
                          variant={action.variant}
                          loading={busyId === app._id}
                          onClick={() =>
                            run(app._id, () => applicationApi.updateStatus(app._id, action.status))
                          }
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}

                {/* Student actions */}
                {!isCompany && app.status === 'submitted' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === app._id}
                    onClick={() => run(app._id, () => applicationApi.withdraw(app._id))}
                  >
                    Withdraw
                  </Button>
                )}
                {!isCompany && app.status === 'offered' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={busyId === app._id}
                      onClick={() => run(app._id, () => applicationApi.respondOffer(app._id, 'accept'))}
                    >
                      Accept offer
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busyId === app._id}
                      onClick={() => run(app._id, () => applicationApi.respondOffer(app._id, 'reject'))}
                    >
                      Decline
                    </Button>
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
