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

      {/* Cover letter — verbatim from the application. */}
      {a.coverLetter && (
        <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
          <p className="text-xs font-medium text-slate-500">Cover letter</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.coverLetter}</p>
        </div>
      )}

      {/* Everything the student attached at apply-time — CV (if highlighted),
          certifications, work experience, portfolio items, manual uploads.
          Each shows a clickable link when there's a path/URL; informational
          rows (e.g. work-experience text) render as plain bullets. */}
      {a.attachments?.length > 0 && (
        <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
          <p className="text-xs font-medium text-slate-500">
            Submitted with this application ({a.attachments.length})
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {a.attachments.map((att, i) => {
              const href = att.link || att.path;
              const kindLabel = att.kind ? att.kind.replace(/_/g, ' ') : 'attachment';
              return (
                <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {kindLabel}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      📎 {att.label || att.filename || href}
                    </a>
                  ) : (
                    <span className="text-slate-700">
                      {att.label}
                      {att.detail ? <span className="text-slate-500"> — {att.detail}</span> : null}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile CV — always-on identity reference for the verifier.
          Independent of what was attached to this particular application. */}
      {a.studentId?.cv?.path && (
        <a
          href={a.studentId.cv.path}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-slate-500 hover:text-brand-600 hover:underline"
        >
          📄 Profile CV ({a.studentId.cv.filename || 'résumé'})
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
