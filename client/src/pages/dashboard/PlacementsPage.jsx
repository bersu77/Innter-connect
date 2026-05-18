import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Select, Spinner } from '../../components/ui';

const STATUS_TONE = { pending: 'warning', active: 'brand', completed: 'success', terminated: 'danger' };

function AssignSupervisor({ placement, supervisors, onAssign }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function assign() {
    if (!value) return;
    setBusy(true);
    try {
      await onAssign(placement._id, value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onChange={(e) => setValue(e.target.value)} className="w-44">
        <option value="">Assign supervisor…</option>
        {supervisors.map((s) => (
          <option key={s._id} value={s._id}>
            {s.firstName} {s.lastName}
          </option>
        ))}
      </Select>
      <Button size="sm" loading={busy} disabled={!value} onClick={assign}>
        Assign
      </Button>
    </div>
  );
}

export default function PlacementsPage() {
  const { user } = useAuth();
  const isCompany = (user?.userType ?? user?.role) === 'company';

  const [placements, setPlacements] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const tasks = [placementApi.list()];
      if (isCompany) tasks.push(placementApi.supervisors());
      const [placementRes, supervisorRes] = await Promise.all(tasks);
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

  async function assignSupervisor(placementId, supervisorId) {
    setError('');
    try {
      await placementApi.assignSupervisor(placementId, supervisorId);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign supervisor.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Placements</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isCompany
            ? 'Confirmed internships — assign supervisors and track progress.'
            : 'Confirmed internship placements.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : placements.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No placements yet.</Card>
      ) : (
        <div className="space-y-3">
          {placements.map((p) => (
            <Card key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="font-semibold text-slate-800">
                  {p.internshipId?.title || 'Internship'}
                </div>
                <div className="text-sm text-slate-500">
                  {p.studentId?.userId
                    ? `${p.studentId.userId.firstName} ${p.studentId.userId.lastName}`
                    : '—'}
                  {' · '}
                  {p.companyId?.name || ''}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Supervisor:{' '}
                  {p.supervisorId
                    ? `${p.supervisorId.firstName} ${p.supervisorId.lastName}`
                    : 'not assigned'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                {isCompany && !p.supervisorId && (
                  <AssignSupervisor
                    placement={p}
                    supervisors={supervisors}
                    onAssign={assignSupervisor}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
