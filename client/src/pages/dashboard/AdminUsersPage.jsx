import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { Badge, Button, Card, Input, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

const STATUS_TONE = { active: 'success', suspended: 'warning', deleted: 'danger' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});

  const roleOptions = [...new Set(users.map((u) => u.userType).filter(Boolean))].sort();
  const statusOptions = [...new Set(users.map((u) => u.status).filter(Boolean))].sort();
  const visible = users.filter(
    (u) =>
      (!filters.userType || u.userType === filters.userType) &&
      (!filters.status || u.status === filters.status),
  );

  async function load(term = '') {
    setLoading(true);
    setError('');
    try {
      const { users: list } = await adminApi.listUsers(term ? { search: term } : {});
      setUsers(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    setBusyId(id);
    setError('');
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((list) => list.map((u) => (u._id === id ? { ...u, status } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Activate, suspend, and review every platform account.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <Input
          className="flex-1"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {!loading && users.length > 0 && (
        <FilterBar
          filters={[
            { key: 'userType', label: 'Roles', options: roleOptions },
            { key: 'status', label: 'Statuses', options: statusOptions },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{u.userType}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.userType !== 'admin' &&
                        (u.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busyId === u._id}
                            onClick={() => setStatus(u._id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busyId === u._id}
                            onClick={() => setStatus(u._id, 'active')}
                          >
                            Activate
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                      No users found.
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
