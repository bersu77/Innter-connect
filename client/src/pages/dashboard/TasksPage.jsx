import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';

const TONE = { assigned: 'neutral', in_progress: 'brand', completed: 'success', overdue: 'danger' };
const label = (s) => (s || '').replace(/_/g, ' ');

function requiredList(task) {
  const r = task.requiredDeliverables || {};
  return [r.document && 'document', r.link && 'link', r.note && 'note'].filter(Boolean);
}

// Read-only view of what the student submitted.
function SubmissionView({ submission }) {
  if (!submission?.submittedAt) return null;
  return (
    <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
      <p className="font-medium text-slate-700">Submitted work</p>
      {submission.documentPath && (
        <a
          href={submission.documentPath}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-brand-600 hover:underline"
        >
          📎 {submission.documentName || 'Download document'}
        </a>
      )}
      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block break-all text-brand-600 hover:underline"
        >
          🔗 {submission.link}
        </a>
      )}
      {submission.note && (
        <p className="mt-1 whitespace-pre-line text-slate-600">{submission.note}</p>
      )}
    </div>
  );
}

// Student submission form — required deliverables are enforced.
function SubmissionForm({ task, onSubmit }) {
  const req = task.requiredDeliverables || {};
  const [link, setLink] = useState(task.submission?.link || '');
  const [note, setNote] = useState(task.submission?.note || '');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reqList = requiredList(task);
  const star = <span className="text-red-500">*</span>;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (req.document && !file && !task.submission?.documentPath) {
      setError('A document is required for this task.');
      return;
    }
    if (req.link && !link.trim()) {
      setError('A link is required for this task.');
      return;
    }
    if (req.note && !note.trim()) {
      setError('A note is required for this task.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(task._id, { document: file, link, note });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <p className="text-xs font-medium text-slate-500">
        Submit your work
        {reqList.length
          ? ` — required: ${reqList.join(', ')}`
          : ' — no required deliverables (attach anything optional)'}
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Document {req.document && star}
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0] || null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>
      <Input
        label={<>Link {req.link && star}</>}
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://github.com/… or a shared drive link"
      />
      <Textarea
        label={<>Note {req.note && star}</>}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything the supervisor should know about your submission…"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" size="sm" loading={busy}>
        Submit task
      </Button>
    </form>
  );
}

// Supervisor grading panel.
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
    requireDocument: false,
    requireLink: false,
    requireNote: false,
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

  async function startTask(id) {
    setBusyId(id);
    setError('');
    try {
      await taskApi.updateProgress(id, 'in_progress');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function submitWork(id, data) {
    await taskApi.submit(id, data);
    await load();
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
      setForm({
        placementId: '',
        title: '',
        description: '',
        deadline: '',
        maxScore: 100,
        requireDocument: false,
        requireLink: false,
        requireNote: false,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the task.');
    } finally {
      setCreating(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent
            ? 'Tasks assigned by your supervisor — submit the required deliverables and see your grades.'
            : 'Assign tasks with required deliverables, then review submissions and grade them.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!isStudent && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Assign a new task</h2>
          <form onSubmit={createTask} className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              className="sm:col-span-2"
              label="Placement"
              value={form.placementId}
              onChange={set('placementId')}
            >
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
            <Input
              className="sm:col-span-2"
              label="Title"
              value={form.title}
              onChange={set('title')}
              placeholder="Build the login screen"
            />
            <Textarea
              className="sm:col-span-2"
              label="Detailed description"
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="What the task is, expectations, and how it will be graded…"
            />
            <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
            <Input
              label="Graded out of"
              type="number"
              min="1"
              value={form.maxScore}
              onChange={set('maxScore')}
            />
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Required deliverables</p>
              <p className="mb-2 text-xs text-slate-400">
                The student cannot submit without the items you tick here.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  ['requireDocument', 'Document'],
                  ['requireLink', 'Link'],
                  ['requireNote', 'Note'],
                ].map(([key, lbl]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={toggle(key)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
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
          {tasks.map((task) => {
            const reqList = requiredList(task);
            return (
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
                  <span>
                    {task.deadline
                      ? `Due ${new Date(task.deadline).toLocaleDateString()}`
                      : 'No deadline'}
                  </span>
                  <span>Graded out of {task.maxScore ?? 100}</span>
                  {reqList.length > 0 && <span>Required: {reqList.join(', ')}</span>}
                </div>

                {/* What the student submitted — visible to both roles */}
                <SubmissionView submission={task.submission} />

                {/* Graded result — visible once graded */}
                {task.gradedAt && (
                  <div className="mt-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm">
                    <span className="font-semibold text-brand-800">
                      Score: {task.score}/{task.maxScore ?? 100}
                    </span>
                    {task.feedback && <p className="mt-1 text-brand-800/80">{task.feedback}</p>}
                  </div>
                )}

                {/* Student — start + submission form */}
                {isStudent && task.status !== 'completed' && (
                  <>
                    {task.status === 'assigned' && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyId === task._id}
                          onClick={() => startTask(task._id)}
                        >
                          Start task
                        </Button>
                      </div>
                    )}
                    <SubmissionForm task={task} onSubmit={submitWork} />
                  </>
                )}

                {/* Supervisor — grading */}
                {!isStudent && <GradeForm task={task} onGrade={grade} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
