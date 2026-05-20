import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';

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

const APPEAL_TONE = { pending: 'warning', upheld: 'neutral', adjusted: 'success' };

// Grade appeal — the student appeals a graded task; the supervisor resolves it.
function AppealSection({ task, isStudent, onAppeal, onResolve }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [score, setScore] = useState(task.score ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // A grade must exist before it can be appealed (an auto-zero counts as a grade).
  if (!task.gradedAt) return null;
  const appeal = task.gradeAppeal?.submittedAt ? task.gradeAppeal : null;

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
      setBusy(false);
    }
  }

  if (appeal) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-amber-800">Grade appeal</span>
          <Badge tone={APPEAL_TONE[appeal.status]}>{appeal.status}</Badge>
        </div>
        <p className="mt-1 whitespace-pre-line text-amber-800/80">“{appeal.reason}”</p>
        {appeal.documents?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {appeal.documents.map((d, i) => (
              <a
                key={i}
                href={d.path}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                📎 {d.filename}
              </a>
            ))}
          </div>
        )}
        {appeal.response && (
          <p className="mt-1.5 border-t border-amber-200 pt-1.5 text-slate-600">
            <span className="font-medium text-slate-700">Supervisor: </span>
            {appeal.response}
          </p>
        )}
        {!isStudent && appeal.status === 'pending' && (
          <div className="mt-2 space-y-2 border-t border-amber-200 pt-2">
            <Textarea
              label="Response to the student"
              rows={2}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Explain your decision…"
            />
            <div className="flex items-end gap-2">
              <Input
                label={`Adjust score (0–${task.maxScore ?? 100})`}
                type="number"
                min="0"
                max={task.maxScore ?? 100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-40"
              />
              <Button
                size="sm"
                loading={busy}
                onClick={() => {
                  if (!response.trim()) {
                    setError('Please write a response.');
                    return;
                  }
                  run(() => onResolve(task._id, { response, score }));
                }}
              >
                Resolve appeal
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  if (!isStudent) return null;

  return (
    <div className="mt-3">
      {open ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Textarea
            label="Why are you appealing this grade?"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what you'd like the supervisor to reconsider…"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Supporting documents (optional)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={busy}
              onClick={() => {
                if (!reason.trim()) {
                  setError('Please explain why you are appealing.');
                  return;
                }
                run(() => onAppeal(task._id, reason, files));
              }}
            >
              Submit appeal
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Appeal this grade
        </Button>
      )}
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
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [form, setForm] = useState({
    placementId: '',
    assignToAll: false,
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

  async function appeal(id, reason, documents) {
    await taskApi.appeal(id, reason, documents);
    await load();
  }

  async function resolveAppeal(id, data) {
    await taskApi.resolveAppeal(id, data);
    await load();
  }

  async function createTask(e) {
    e.preventDefault();
    setError('');
    if (!form.title || (!form.assignToAll && !form.placementId)) {
      setError('A title and a placement (or "assign to all my interns") are required.');
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
        assignToAll: false,
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

  // Per-role search + status filter — each role already sees only its own
  // tasks; this filters within that by text and by task status.
  const query = search.trim().toLowerCase();
  const statusOptions = [...new Set(tasks.map((t) => t.status).filter(Boolean))].sort();
  const visibleTasks = tasks.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (!query) return true;
    const supervisor = t.assignedBy ? `${t.assignedBy.firstName} ${t.assignedBy.lastName}` : '';
    const student = t.studentId?.userId
      ? `${t.studentId.userId.firstName} ${t.studentId.userId.lastName}`
      : '';
    return [t.tag, t.title, t.description, t.status, supervisor, student]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow={isStudent ? 'Your tasks' : 'Mentorship'}
        title="Tasks"
        lede={
          isStudent
            ? 'Tasks assigned by your supervisor — submit the required deliverables and see your grades.'
            : 'Assign tasks with required deliverables, then review submissions and grade them.'
        }
      />

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!isStudent && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Assign a new task</h2>
          <form onSubmit={createTask} className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.assignToAll}
                  onChange={toggle('assignToAll')}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Assign to all my current interns
              </label>
              {form.assignToAll ? (
                <p className="mt-1.5 text-xs text-slate-400">
                  Every active intern gets their own copy, numbered in their own sequence.
                </p>
              ) : (
                <Select
                  className="mt-2"
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
              )}
            </div>
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
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search tasks by tag, title or name…"
            filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
          {visibleTasks.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400">
              No tasks match your filters.
            </Card>
          )}
          {visibleTasks.map((task) => {
            const reqList = requiredList(task);
            return (
              <Card key={task._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {task.tag && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-500">
                          {task.tag}
                        </span>
                      )}
                      <h3 className="font-semibold text-slate-800">{task.title}</h3>
                    </div>
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
                    {isStudent && task.assignedBy && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Assigned by {task.assignedBy.firstName} {task.assignedBy.lastName}
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

                {/* Student — start + submission form (a locked overdue task has neither) */}
                {isStudent && !['completed', 'overdue'].includes(task.status) && (
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

                {/* Supervisor — grading (hidden while an appeal awaits resolution) */}
                {!isStudent && task.gradeAppeal?.status !== 'pending' && (
                  <GradeForm task={task} onGrade={grade} />
                )}

                {/* Grade appeal — student raises it, supervisor resolves it */}
                <AppealSection
                  task={task}
                  isStudent={isStudent}
                  onAppeal={appeal}
                  onResolve={resolveAppeal}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
