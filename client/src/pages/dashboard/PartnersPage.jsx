import { useEffect, useState } from 'react';
import { companySearchApi, invitationApi } from '../../api/internships';
import { Badge, Button, Card, Input, Spinner, Textarea } from '../../components/ui';

const STATUS_TONE = { sent: 'warning', accepted: 'success', declined: 'danger' };

export default function PartnersPage() {
  const [companies, setCompanies] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  // The company whose invite form is open, plus its optional message.
  const [invitingId, setInvitingId] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');

  async function load(term = '') {
    setLoading(true);
    try {
      const [companyRes, inviteRes] = await Promise.all([
        companySearchApi.list(term ? { search: term } : {}),
        invitationApi.list(),
      ]);
      setCompanies(companyRes.companies || []);
      setInvitations(inviteRes.invitations || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const invitedIds = new Set(invitations.map((i) => String(i.companyId?._id || i.companyId)));

  function openInvite(companyId) {
    setInvitingId(companyId);
    setInviteMessage('');
    setMessage(null);
  }

  async function sendInvite(companyId) {
    setBusyId(companyId);
    setMessage(null);
    try {
      await invitationApi.send(companyId, inviteMessage.trim() || undefined);
      setMessage({ type: 'success', text: 'Invitation sent.' });
      setInvitingId(null);
      setInviteMessage('');
      await load(search);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not send invitation.' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Partner companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search organisations and invite them to partner for internships.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-sm ${
            message.type === 'success' ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <Input
          className="flex-1"
          placeholder="Search companies by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {companies.map((c) => {
              const invited = invitedIds.has(String(c._id));
              const open = invitingId === c._id;
              return (
                <Card key={c._id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">
                        {[c.industry, c.city].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={invited || open ? 'secondary' : 'primary'}
                      disabled={invited}
                      onClick={() => (open ? setInvitingId(null) : openInvite(c._id))}
                    >
                      {invited ? 'Invited' : open ? 'Cancel' : 'Invite'}
                    </Button>
                  </div>
                  {open && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <Textarea
                        label="Message (optional)"
                        rows={2}
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        placeholder="Add a note for the company — why you'd like to partner…"
                      />
                      <Button size="sm" loading={busyId === c._id} onClick={() => sendInvite(c._id)}>
                        Send invitation
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
            {companies.length === 0 && (
              <Card className="p-8 text-center text-sm text-slate-400 sm:col-span-2">
                No companies found.
              </Card>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold">Sent invitations</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv._id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {inv.companyId?.name || '—'}
                          {inv.message && (
                            <span className="mt-0.5 block text-xs font-normal text-slate-400">
                              “{inv.message}”
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {invitations.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                          No invitations sent yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
