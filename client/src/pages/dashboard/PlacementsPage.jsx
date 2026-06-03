import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Select, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

const STATUS_TONE = { pending: 'warning', active: 'brand', completed: 'success', terminated: 'danger' };
const tick = (done) => (done ? '✓' : '○');

function PlacementCard({ placement: p, role, isSupervisor, supervisors, onReload }) {
  const [busy, setBusy] = useState(false);
  const [supId, setSupId] = useState('');
  const [changing, setChanging] = useState(false);
  const [mode, setMode] = useState('continue');
  const [error, setError] = useState('');

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await onReload();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
      setBusy(false);
    }
  }

  const studentName = p.studentId?.userId
    ? `${p.studentId.userId.firstName} ${p.studentId.userId.lastName}`
    : '—';

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-800">{p.internshipId?.title || 'Internship'}</div>
          <div className="text-sm text-slate-500">
            {studentName} · {p.companyId?.name || ''}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Supervisor:{' '}
            {p.supervisorId ? `${p.supervisorId.firstName} ${p.supervisorId.lastName}` : 'not assigned'}
          </div>
        </div>
        <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>{tick(p.finalReport?.submittedAt)} Final report</span>
        <span>{tick(p.completionApprovedBySupervisor)} Supervisor confirmed</span>
        <span>{tick(p.completionValidatedByUniversity)} University validated</span>
      </div>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {role === 'company' && !isSupervisor && !p.supervisorId && (
          <div className="flex items-center gap-2">
            <Select value={supId} onChange={(e) => setSupId(e.target.value)} className="w-44">
              <option value="">Assign supervisor…</option>
              {supervisors.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              loading={busy}
              disabled={!supId}
              onClick={() => run(() => placementApi.assignSupervisor(p._id, supId))}
            >
              Assign
            </Button>
          </div>
        )}

        {role === 'company' && !isSupervisor && p.supervisorId && !changing && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setChanging(true);
              setSupId('');
              setMode('continue');
              setError('');
            }}
          >
            Change supervisor
          </Button>
        )}

        {role === 'company' && !isSupervisor && p.supervisorId && changing && (
          <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Select value={supId} onChange={(e) => setSupId(e.target.value)} className="w-56">
              <option value="">New supervisor…</option>
              {supervisors
                .filter((s) => s._id !== p.supervisorId._id)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
            </Select>
            <fieldset className="space-y-1.5 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`mode-${p._id}`}
                  checked={mode === 'continue'}
                  onChange={() => setMode('continue')}
                />
                Continue the existing conversation
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`mode-${p._id}`}
                  checked={mode === 'fresh'}
                  onChange={() => setMode('fresh')}
                />
                Start a fresh conversation
              </label>
            </fieldset>
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={busy}
                disabled={!supId}
                onClick={() => run(() => placementApi.assignSupervisor(p._id, supId, mode))}
              >
                Apply
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setChanging(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {role === 'student' && p.status !== 'completed' && !p.finalReport?.submittedAt && (
          <label className="cursor-pointer">
            <span className="inline-flex h-9 items-center rounded-xl bg-brand-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-700">
              Submit final report
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) run(() => placementApi.submitReport(p._id, file));
              }}
            />
          </label>
        )}
        {role === 'student' && p.finalReport?.submittedAt && (
          <span className="text-xs text-slate-400">Report submitted: {p.finalReport.filename}</span>
        )}

        {(isSupervisor || role === 'university') && p.finalReport?.submittedAt && (
          <a
            href={p.finalReport.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            View report
            <span className="text-xs text-slate-400">({p.finalReport.filename})</span>
          </a>
        )}

        {isSupervisor && p.finalReport?.submittedAt && !p.completionApprovedBySupervisor && (
          <Button size="sm" loading={busy} onClick={() => run(() => placementApi.confirmCompletion(p._id))}>
            Confirm completion
          </Button>
        )}

        {role === 'university' && p.completionApprovedBySupervisor && !p.completionValidatedByUniversity && (
          <Button size="sm" loading={busy} onClick={() => run(() => placementApi.validateCompletion(p._id))}>
            Validate completion
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function PlacementsPage() {
  const { user } = useAuth();
  const role = user?.userType ?? user?.role;
  const isSupervisor = (user?.roles || []).includes('supervisor');

  const [placements, setPlacements] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const statusOptions = [...new Set(placements.map((p) => p.status).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const visible = placements.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (!query) return true;
    const student = p.studentId?.userId
      ? `${p.studentId.userId.firstName} ${p.studentId.userId.lastName}`
      : '';
    const supervisor = p.supervisorId
      ? `${p.supervisorId.firstName} ${p.supervisorId.lastName}`
      : '';
    return [p.internshipId?.title, p.companyId?.name, student, supervisor]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  async function load() {
    setLoading(true);
    try {
      const requests = [placementApi.list()];
      if (role === 'company' && !isSupervisor) requests.push(placementApi.supervisors());
      const [placementRes, supervisorRes] = await Promise.all(requests);
      setPlacements(placementRes.placements || []);
      if (supervisorRes) setSupervisors(supervisorRes.supervisors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load placements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Placements</h1>
        <p className="mt-1 text-sm text-slate-500">
          Confirmed internships — supervision, final reports, and completion.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!loading && placements.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by student, internship, company or supervisor…"
          filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : placements.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No placements yet.</Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No placements match your filters.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <PlacementCard
              key={p._id}
              placement={p}
              role={role}
              isSupervisor={isSupervisor}
              supervisors={supervisors}
              onReload={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
