import { useEffect, useState } from 'react';
import { invitationApi } from '../../api/internships';
import { Badge, Button, Card, Spinner } from '../../components/ui';

const STATUS_TONE = { sent: 'warning', accepted: 'success', declined: 'danger' };

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { invitations: list } = await invitationApi.list();
      setInvitations(list || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(id, decision) {
    setBusyId(id);
    setError('');
    try {
      await invitationApi.respond(id, decision);
      setInvitations((list) => list.map((i) => (i._id === id ? { ...i, status: decision } : i)));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Partnership invitations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Universities that have invited your company to partner for internships.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : invitations.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No invitations yet.</Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv._id} className="flex items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium text-slate-800">{inv.universityId?.name || '—'}</div>
                {inv.message && <p className="mt-0.5 text-sm text-slate-500">{inv.message}</p>}
                <div className="mt-1">
                  <Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge>
                </div>
              </div>
              {inv.status === 'sent' && (
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" loading={busyId === inv._id} onClick={() => respond(inv._id, 'accepted')}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === inv._id}
                    onClick={() => respond(inv._id, 'declined')}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
