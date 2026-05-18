import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { Badge, Button, Card, Spinner } from '../../components/ui';

export default function AdminVerificationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { companies, universities } = await adminApi.listOrganizations();
      setRows([
        ...companies.map((c) => ({ ...c, type: 'company' })),
        ...universities.map((u) => ({ ...u, type: 'university' })),
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(type, id, decision) {
    setBusyId(id);
    setError('');
    try {
      await adminApi.verifyOrganization(type, id, decision);
      setRows((list) =>
        list.map((r) => (r._id === id ? { ...r, verified: decision === 'approved' } : r)),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and verify companies and universities on the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((org) => (
                  <tr key={`${org.type}-${org._id}`} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{org.name}</div>
                      <div className="text-xs capitalize text-slate-400">{org.type}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {[org.city, org.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={org.verified ? 'success' : 'warning'}>
                        {org.verified ? 'verified' : 'pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {!org.verified && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            loading={busyId === org._id}
                            onClick={() => decide(org.type, org._id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busyId === org._id}
                            onClick={() => decide(org.type, org._id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                      No organizations to review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
