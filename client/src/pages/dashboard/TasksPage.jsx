import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';

const TONE = { assigned: 'neutral', in_progress: 'brand', completed: 'success', overdue: 'danger' };
const label = (s) => (s || '').replace(/_/g, ' ');

export default function TasksPage() {
  const { user } = useAuth();
  const isStudent = (user?.userType ?? user?.role) === 'student';

  const [tasks, setTasks] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ placementId: '', title: '', description: '', deadline: '' });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const tasksRes = await taskApi.list();
      setTasks(tasksRes.tasks || []);
      if (!isStudent) {
        const placementRes = await placementApi.list();
        setPlacements(placementRes.placements || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function progress(id, status) {
    setBusyId(id);
    setError('');
    try {
      await taskApi.updateProgress(id, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError('');
    if (!form.placementId || !form.title) {
      setError('Placement and title are required.');
      return;
    }
    setCreating(true);
    try {
      await taskApi.create({ ...form, deadline: form.deadline || undefined });
      setForm({ placementId: '', title: '', description: '', deadline: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the task.');
    } finally {
      setCreating(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent
            ? 'Tasks assigned to you by your supervisor.'
            : 'Assign and monitor tasks for the interns you supervise.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!isStudent && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Assign a new task</h2>
          <form onSubmit={createTask} className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select className="sm:col-span-2" label="Placement" value={form.placementId} onChange={set('placementId')}>
              <option value="">Select a placement you supervise</option>
              {placements.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.internshipId?.title || 'Internship'} —{' '}
                  {p.studentId?.userId
                    ? `${p.studentId.userId.firstName} ${p.studentId.userId.lastName}`
                    : 'student'}
                </option>
              ))}
            </Select>
            <Input className="sm:col-span-2" label="Title" value={form.title} onChange={set('title')} placeholder="Build the login screen" />
            <Textarea className="sm:col-span-2" label="Description" value={form.description} onChange={set('description')} rows={3} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
            <div className="flex items-end">
              <Button type="submit" loading={creating}>
                Assign task
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No tasks yet.</Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{task.title}</h3>
                  {task.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{task.description}</p>
                  )}
                  {!isStudent && task.studentId?.userId && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {task.studentId.userId.firstName} {task.studentId.userId.lastName}
                    </p>
                  )}
                </div>
                <Badge tone={TONE[task.status]}>{label(task.status)}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
                </span>
                {isStudent && task.status !== 'completed' && (
                  <div className="flex gap-2">
                    {task.status === 'assigned' && (
                      <Button size="sm" loading={busyId === task._id} onClick={() => progress(task._id, 'in_progress')}>
                        Start task
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busyId === task._id}
                      onClick={() => progress(task._id, 'completed')}
                    >
                      Mark complete
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
