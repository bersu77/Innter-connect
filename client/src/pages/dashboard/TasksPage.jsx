// TasksPage — tabular task view for students & supervisors.
//
// Replaces the previous "scroll forever through cards" layout with a real
// table: paginated 20 / page, sortable per column, with a mobile-card
// fallback. Per-task actions (submit / grade / appeal / resolve appeal /
// view detail) all live inside a single TaskDetailsModal that opens when a
// row is clicked.
//
// The supervisor's "Assign a new task" form stays at the top (collapsible)
// so creating doesn't require leaving the page.

import { useEffect, useState } from 'react';
import { Plus, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import TasksTable from '../../components/tasks/TasksTable';
import TaskDetailsModal from '../../components/tasks/TaskDetailsModal';

// Assignment scope — exactly one of three options is in effect:
//   one        → a single placement (placementId)
//   internship → every intern the supervisor mentors on a given internship
//   all        → every intern the supervisor mentors, across all internships
const EMPTY_FORM = {
  scope: 'one',
  placementId: '',
  internshipId: '',
  title: '',
  description: '',
  deadline: '',
  maxScore: 100,
  requireDocument: false,
  requireLink: false,
  requireNote: false,
};

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

  // Open task (drives the modal). null = closed.
  const [openTask, setOpenTask] = useState(null);

  // Supervisor's create-task form; collapsible to keep the page calm.
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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

  // Whenever a task changes server-side, refresh the open one too so the
  // modal reflects the new state without forcing the user to re-open it.
  function reopenAfterRefresh(prevId) {
    if (!prevId) return;
    setTasks((cur) => {
      // No-op; the actual refresh happens in load(). We re-sync openTask
      // from the freshly loaded list inside the await chain below.
      return cur;
    });
  }

  async function startTask(id) {
    setBusyId(id);
    setError('');
    try {
      await taskApi.updateProgress(id, 'in_progress');
      await load();
      const fresh = tasksLookup(id);
      if (fresh) setOpenTask(fresh);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  function tasksLookup(id) {
    return tasks.find((t) => t._id === id) || null;
  }

  async function submitWork(id, data) {
    await taskApi.submit(id, data);
    await load();
    reopenAfterRefresh(id);
  }
  async function grade(id, score, feedback) {
    setError('');
    try {
      await taskApi.grade(id, score, feedback);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not grade the task.');
      throw err;
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
    if (!form.title) {
      setError('A task title is required.');
      return;
    }
    if (form.scope === 'one' && !form.placementId) {
      setError('Pick which intern to assign this task to.');
      return;
    }
    if (form.scope === 'internship' && !form.internshipId) {
      setError('Pick which internship to assign all its interns.');
      return;
    }
    setCreating(true);
    try {
      // Translate the scope choice into the API contract.
      const body = {
        ...form,
        deadline: form.deadline || undefined,
        maxScore: Number(form.maxScore) || 100,
        assignToAll: form.scope === 'all',
        assignToInternship: form.scope === 'internship',
      };
      // Strip fields the server doesn't expect for the chosen scope, so a
      // stale placementId doesn't get sent on an "all interns" assign.
      if (form.scope !== 'one') delete body.placementId;
      if (form.scope !== 'internship') delete body.internshipId;
      delete body.scope;
      await taskApi.create(body);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the task.');
    } finally {
      setCreating(false);
    }
  }

  // Filter / search (table handles sort + pagination from there).
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
    <div className="space-y-6">
      <PageHeader
        eyebrow={isStudent ? 'Your tasks' : 'Mentorship'}
        title="Tasks"
        lede={
          isStudent
            ? 'Tasks assigned by your supervisor — submit the required deliverables and see your grades.'
            : 'Assign tasks with required deliverables, then review submissions and grade them.'
        }
        meta={tasks.length ? `${tasks.length} total` : null}
        actions={
          !isStudent ? (
            <Button
              variant={formOpen ? 'secondary' : 'primary'}
              leading={formOpen
                ? <ChevronUp size={14} strokeWidth={1.8} />
                : <Plus size={14} strokeWidth={1.8} />}
              onClick={() => setFormOpen((o) => !o)}
            >
              {formOpen ? 'Hide form' : 'Assign a task'}
            </Button>
          ) : null
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-md px-3.5 py-2.5 text-sm"
          style={{ background: 'var(--danger-50)', color: 'var(--danger-700)' }}
        >
          {error}
        </div>
      )}

      {/* Collapsible create form — supervisors only. */}
      {!isStudent && formOpen && (
        <Card style={{ padding: 22 }}>
          <span className="t-eyebrow">Assign a new task</span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              fontWeight: 400,
              margin: '6px 0 14px',
            }}
          >
            What do you want done?
          </h2>
          <form onSubmit={createTask} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {/* Scope picker — radio: one intern / one internship / all interns. */}
              <p
                className="t-label"
                style={{ color: 'var(--text-secondary)', marginBottom: 6 }}
              >
                Assign to
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'one',
                    label: 'One intern',
                    hint: 'Pick a single placement you supervise.',
                  },
                  {
                    id: 'internship',
                    label: 'Every intern on a given internship',
                    hint:
                      'All of your interns under that internship get their own copy — numbered in each student\'s own sequence.',
                  },
                  {
                    id: 'all',
                    label: 'All my current interns',
                    hint:
                      'Every active intern you supervise, across every internship.',
                  },
                ].map((opt) => {
                  const active = form.scope === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-3"
                      style={{
                        background: active ? 'var(--brand-50)' : 'var(--bg-subtle)',
                        boxShadow: active
                          ? '0 0 0 1px var(--brand-500)'
                          : 'inset 0 0 0 1px var(--border-subtle)',
                      }}
                    >
                      <input
                        type="radio"
                        name="task-scope"
                        value={opt.id}
                        checked={active}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            scope: opt.id,
                            // Clear the side that no longer applies, so a
                            // stale value can't be submitted.
                            placementId: opt.id === 'one' ? f.placementId : '',
                            internshipId: opt.id === 'internship' ? f.internshipId : '',
                          }))
                        }
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className="t-body-md block"
                          style={{
                            fontWeight: 500,
                            color: active ? 'var(--brand-700)' : 'var(--text-primary)',
                          }}
                        >
                          {opt.label}
                        </span>
                        <span
                          className="t-caption block"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {opt.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Scope-specific selector. */}
              {form.scope === 'one' && (
                <Select
                  className="mt-3"
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
              {form.scope === 'internship' && (() => {
                // Distinct internships across the supervisor's placements,
                // with a count of how many interns each one carries — handy
                // so the supervisor sees "Frontend Internship (12 interns)".
                const byId = new Map();
                for (const p of placements) {
                  const id = p.internshipId?._id || p.internshipId;
                  if (!id) continue;
                  const cur = byId.get(String(id)) || {
                    id,
                    title: p.internshipId?.title || 'Internship',
                    count: 0,
                  };
                  cur.count += 1;
                  byId.set(String(id), cur);
                }
                const internships = Array.from(byId.values());
                return (
                  <Select
                    className="mt-3"
                    label="Internship"
                    value={form.internshipId}
                    onChange={set('internshipId')}
                  >
                    <option value="">Select an internship</option>
                    {internships.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.title} — {it.count} {it.count === 1 ? 'intern' : 'interns'}
                      </option>
                    ))}
                  </Select>
                );
              })()}
              {form.scope === 'all' && (
                <p
                  className="mt-3 t-caption"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {placements.length} {placements.length === 1 ? 'intern' : 'interns'} will receive
                  their own copy.
                </p>
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
              <p
                className="t-label"
                style={{ marginBottom: 4, color: 'var(--text-secondary)' }}
              >
                Required deliverables
              </p>
              <p className="t-caption" style={{ marginBottom: 8, color: 'var(--text-tertiary)' }}>
                The student cannot submit without the items you tick here.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  ['requireDocument', 'Document'],
                  ['requireLink', 'Link'],
                  ['requireNote', 'Note'],
                ].map(([key, lbl]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 t-body-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={toggle(key)}
                      className="h-4 w-4 rounded"
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={creating}>
                Assign task
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter bar */}
      {!loading && tasks.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search tasks by tag, title or name…"
          filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {/* Table / mobile card list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{
            background: 'var(--bg-raised)',
            boxShadow: '0 0 0 1px var(--border-subtle)',
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}
        >
          No tasks yet.
          {!isStudent && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                style={{
                  color: 'var(--brand-600)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Assign one →
              </button>
            </>
          )}
        </div>
      ) : (
        <TasksTable
          tasks={visibleTasks}
          isStudent={isStudent}
          onOpen={setOpenTask}
        />
      )}

      {/* Detail / action modal */}
      <TaskDetailsModal
        task={openTask}
        isStudent={isStudent}
        busyId={busyId}
        onClose={() => setOpenTask(null)}
        onStart={startTask}
        onSubmit={submitWork}
        onGrade={grade}
        onAppeal={appeal}
        onResolveAppeal={resolveAppeal}
      />
    </div>
  );
}
