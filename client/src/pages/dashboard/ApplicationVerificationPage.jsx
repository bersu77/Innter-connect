import { useEffect, useState } from 'react';
import { applicationApi } from '../../api/applications';
import { Badge, Button, Card, Spinner, Textarea } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

const V_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };

// One application awaiting (or showing) the university's verification verdict.
function VerifyCard({ application: a, onVerify }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const v = a.universityVerification || {};
  const student = a.studentId?.userId
    ? `${a.studentId.userId.firstName} ${a.studentId.userId.lastName}`
    : 'Student';

  async function run(decision) {
    if (decision === 'reject' && !note.trim()) {
      setError('Please give a reason for rejecting.');
      return;
    }
    setBusy(decision);
    setError('');
    try {
      await onVerify(a._id, decision, note);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
      setBusy('');
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">{student}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Applying to “{a.internshipId?.title}” · {a.companyId?.name || ''}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {[a.studentId?.major, a.studentId?.gpa != null && `GPA ${a.studentId.gpa}`]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        </div>
        <Badge tone={V_TONE[v.status] || 'warning'}>{v.status || 'pending'}</Badge>
      </div>

      {a.studentId?.cv?.path && (
        <a
          href={a.studentId.cv.path}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-brand-600 hover:underline"
        >
          📎 View student CV
        </a>
      )}

      {v.status === 'pending' ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <Textarea
            label="Note / reason (required to reject)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Confirm the student's enrolment, or explain why verification fails…"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" loading={busy === 'approve'} onClick={() => run('approve')}>
              Verify student
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={busy === 'reject'}
              onClick={() => run('reject')}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : (
        v.note && (
          <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{v.note}</p>
        )
      )}
    </Card>
  );
}

export default function ApplicationVerificationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});

  async function load() {
    setLoading(true);
    try {
      const { applications: list } = await applicationApi.list();
      setApplications(list || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(id, decision, note) {
    await applicationApi.verify(id, decision, note);
    await load();
  }

  const vStatus = (a) => a.universityVerification?.status || 'pending';
  const statusOptions = [...new Set(applications.map(vStatus))].sort();
  const visible = filters.status
    ? applications.filter((a) => vStatus(a) === filters.status)
    : applications;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Application verifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Students from your university have applied to companies — verify their enrolment and
          documents so the company can proceed.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!loading && applications.length > 0 && (
        <FilterBar
          filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No applications from your students yet.
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No applications match your filter.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <VerifyCard key={a._id} application={a} onVerify={verify} />
          ))}
        </div>
      )}
    </div>
  );
}
