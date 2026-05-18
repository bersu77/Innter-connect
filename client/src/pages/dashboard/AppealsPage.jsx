import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { verificationApi } from '../../api/verification';
import { Badge, Button, Card, Spinner, Textarea } from '../../components/ui';

const V_TONE = { approved: 'success', rejected: 'danger', pending: 'warning' };
const A_TONE = { pending: 'warning', upheld: 'danger', overturned: 'success' };

// ── Admin view — review submitted appeals ──
function AdminAppeals() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { appeals: list } = await verificationApi.listAppeals();
      setAppeals(list || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    setBusyId(id);
    setError('');
    try {
      await verificationApi.decideAppeal(id, decision);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <>
      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
      {appeals.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No appeals submitted.</Card>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => (
            <Card key={a._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800">
                    {a.submittedBy?.firstName} {a.submittedBy?.lastName}
                  </div>
                  <div className="text-xs capitalize text-slate-400">
                    {a.verificationId?.entityType} verification appeal
                  </div>
                </div>
                <Badge tone={A_TONE[a.status]}>{a.status}</Badge>
              </div>
              {a.reason && (
                <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                  {a.reason}
                </p>
              )}
              {a.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" loading={busyId === a._id} onClick={() => decide(a._id, 'overturned')}>
                    Overturn (approve)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === a._id}
                    onClick={() => decide(a._id, 'upheld')}
                  >
                    Uphold rejection
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ── Entity view — see own verifications, appeal rejected ones ──
function MyAppeals() {
  const [verifications, setVerifications] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasons, setReasons] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await verificationApi.mine();
      setVerifications(data.verifications || []);
      setAppeals(data.appeals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verifications.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const appealFor = (vId) => appeals.find((a) => String(a.verificationId) === String(vId));

  async function submit(vId) {
    const reason = (reasons[vId] || '').trim();
    if (!reason) return;
    setBusyId(vId);
    setError('');
    try {
      await verificationApi.submitAppeal(vId, reason);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit appeal.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <>
      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
      {verifications.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          You have no verification records yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => {
            const appeal = appealFor(v._id);
            return (
              <Card key={v._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold capitalize text-slate-800">
                      {v.entityType} verification
                    </div>
                    {v.remarks && <div className="text-sm text-slate-500">{v.remarks}</div>}
                  </div>
                  <Badge tone={V_TONE[v.status]}>{v.status}</Badge>
                </div>

                {appeal ? (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-500">Your appeal: </span>
                    <Badge tone={A_TONE[appeal.status]}>{appeal.status}</Badge>
                  </div>
                ) : v.status === 'rejected' ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      label="Appeal this decision"
                      rows={3}
                      value={reasons[v._id] || ''}
                      onChange={(e) => setReasons((r) => ({ ...r, [v._id]: e.target.value }))}
                      placeholder="Explain why this verification should be reconsidered…"
                    />
                    <Button
                      size="sm"
                      loading={busyId === v._id}
                      onClick={() => submit(v._id)}
                    >
                      Submit appeal
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function AppealsPage() {
  const { user } = useAuth();
  const isAdmin = (user?.userType ?? user?.role) === 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAdmin ? 'Verification appeals' : 'My verifications & appeals'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAdmin
            ? 'Review appeals submitted against rejected verifications.'
            : 'Track your verification status and appeal a rejected decision.'}
        </p>
      </div>
      {isAdmin ? <AdminAppeals /> : <MyAppeals />}
    </div>
  );
}
