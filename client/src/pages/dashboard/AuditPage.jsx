import { useEffect, useState } from 'react';
import { auditApi } from '../../api/audit';
import { Badge, Button, Card, Input, Select, Spinner } from '../../components/ui';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [topActions, setTopActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', status: '' });
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.status) params.status = filters.status;
      const [logRes, statRes] = await Promise.all([auditApi.logs(params), auditApi.stats()]);
      setLogs(logRes.logs || []);
      setStats(statRes.stats);
      setTopActions(statRes.topActions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit & compliance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review the immutable audit trail and monitor system activity.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-slate-500">Total events</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{stats.total}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Successful</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-600">
              {stats.success}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Failures</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
              {stats.failures}
            </p>
          </Card>
        </div>
      )}

      {topActions.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800">Most frequent actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topActions.map((a) => (
              <Badge key={a.action} tone="brand">
                {a.action} · {a.count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          className="flex-1"
          placeholder="Filter by action (e.g. LOGIN)"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
        />
        <Select
          className="w-40"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </Select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

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
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.userId
                        ? `${log.userId.firstName} ${log.userId.lastName}`
                        : log.userType || 'system'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-500">{log.entityType || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={log.status === 'failure' ? 'danger' : 'success'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No audit entries match the filters.
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
