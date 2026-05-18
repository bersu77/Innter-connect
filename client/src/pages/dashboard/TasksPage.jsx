import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';

const TONE = { assigned: 'neutral', in_progress: 'brand', completed: 'success', overdue: 'danger' };
const label = (s) => (s || '').replace(/_/g, ' ');

// Supervisor grading panel for one task.
function GradeForm({ task, onGrade }) {
  const [score, setScore] = useState(task.score ?? '');
  const [feedback, setFeedback] = useState(task.feedback || '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onGrade(task._id, score, feedback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
      <Input
        label={`Score (out of ${task.maxScore ?? 100})`}
        type="number"
        min="0"
        max={task.maxScore ?? 100}
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      <div className="flex items-end">
        <Button size="sm" loading={busy} onClick={submit}>
          {task.gradedAt ? 'Update grade' : 'Grade task'}
        </Button>
      </div>
      <Textarea
        className="sm:col-span-2"
        label="Feedback / comment"
        rows={2}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Comment on the student's work…"
      />
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const isStudent = (user?.userType ?? user?.role) === 'student';

  const [tasks, setTasks] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    placementId: '',
    title: '',
    description: '',
    deadline: '',
    maxScore: 100,
  });
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

  async function grade(id, score, feedback) {
    setError('');
    try {
      await taskApi.grade(id, score, feedback);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not grade the task.');
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
      await taskApi.create({
        ...form,
        deadline: form.deadline || undefined,
        maxScore: Number(form.maxScore) || 100,
      });
      setForm({ placementId: '', title: '', description: '', deadline: '', maxScore: 100 });
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
            ? 'Tasks assigned by your supervisor — update progress and see your grades.'
            : 'Assign, monitor, and grade tasks for the interns you supervise.'}
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
            <Textarea
              className="sm:col-span-2"
              label="Detailed description"
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="What the task is, expectations, and how it will be graded…"
            />
            <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
            <Input label="Graded out of" type="number" min="1" value={form.maxScore} onChange={set('maxScore')} />
            <div className="flex items-end sm:col-span-2">
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
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-500">
                      {task.description}
                    </p>
                  )}
                  {!isStudent && task.studentId?.userId && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {task.studentId.userId.firstName} {task.studentId.userId.lastName}
                    </p>
                  )}
                </div>
                <Badge tone={TONE[task.status]}>{label(task.status)}</Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>{task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}</span>
                <span>Graded out of {task.maxScore ?? 100}</span>
              </div>

              {/* Graded result — visible to everyone once graded */}
              {task.gradedAt && (
                <div className="mt-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm">
                  <span className="font-semibold text-brand-800">
                    Score: {task.score}/{task.maxScore ?? 100}
                  </span>
                  {task.feedback && <p className="mt-1 text-brand-800/80">{task.feedback}</p>}
                </div>
              )}

              {/* Student progress actions */}
              {isStudent && task.status !== 'completed' && (
                <div className="mt-3 flex gap-2">
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

              {/* Supervisor grading */}
              {!isStudent && <GradeForm task={task} onGrade={grade} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
