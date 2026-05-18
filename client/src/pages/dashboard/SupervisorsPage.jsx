import { useEffect, useState } from 'react';
import { companyApi } from '../../api/profile';
import { Button, Card, Input, Spinner } from '../../components/ui';

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const { supervisors: list } = await companyApi.listSupervisors();
      setSupervisors(list || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function create(e) {
    e.preventDefault();
    setMessage(null);
    if (form.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setCreating(true);
    try {
      const { supervisor } = await companyApi.createSupervisor(form);
      setMessage({
        type: 'success',
        text: `Supervisor created. They sign in with the username "${supervisor.username}" and the password you set — they can change both from their Account page.`,
      });
      setForm({ firstName: '', lastName: '', username: '', password: '' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not create supervisor.' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Supervisors</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create supervisor accounts for your company. Each supervisor signs in with the username
          and password you set, then mentors the interns you assign to them.
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

      <Card className="p-6">
        <h2 className="text-base font-semibold">Add a supervisor</h2>
        <form onSubmit={create} className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input label="First name" required value={form.firstName} onChange={set('firstName')} />
          <Input label="Last name" required value={form.lastName} onChange={set('lastName')} />
          <Input label="Username" required value={form.username} onChange={set('username')} placeholder="e.g. daniel.girma" hint="The supervisor signs in with this." />
          <Input label="Temporary password" type="text" required value={form.password} onChange={set('password')} placeholder="At least 8 characters" hint="Share this securely; they can change it." />
          <div className="sm:col-span-2">
            <Button type="submit" loading={creating}>
              Create supervisor
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
          Your supervisors
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : supervisors.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">No supervisors yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
