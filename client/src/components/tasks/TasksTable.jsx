// TasksTable — paginated, sortable tabular view of tasks.
//
// Replaces the "infinite-scroll list of cards" with a real table:
//   • Columns: Tag · Title · Assigned by/to · Status · Deliverables ·
//     Submission · Score · Deadline · Actions.
//   • Click any column header to sort (asc → desc → off).
//   • Paginated 20 rows per page; pager at the bottom shows the range.
//   • Mobile (<md): table collapses to a stacked card list — same fields,
//     row-per-row, with the same Open action.
//
// All action buttons are rendered into a single "Open" button per row;
// clicking it bubbles a click event to the parent which decides which
// modal to mount. Keeps the table dumb and the page in charge of state.

import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Button, Badge } from '../ui';

const PAGE_SIZE = 20;

const STATUS_TONE = {
  assigned: 'neutral',
  in_progress: 'brand',
  completed: 'success',
  overdue: 'danger',
};
const label = (s) => (s || '').replace(/_/g, ' ');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function requiredKinds(task) {
  const r = task.requiredDeliverables || {};
  return [r.document && 'doc', r.link && 'link', r.note && 'note'].filter(Boolean);
}

// Compare two tasks on a sort key.
function sorter(key, isStudent) {
  return (a, b) => {
    let av;
    let bv;
    switch (key) {
      case 'tag':
        av = a.tag || '';
        bv = b.tag || '';
        return av.localeCompare(bv, undefined, { numeric: true });
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'deadline':
        av = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        bv = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return av - bv;
      case 'score':
        av = a.score == null ? -1 : a.score;
        bv = b.score == null ? -1 : b.score;
        return av - bv;
      case 'submission':
        av = a.submission?.submittedAt ? 1 : 0;
        bv = b.submission?.submittedAt ? 1 : 0;
        return av - bv;
      case 'person': {
        const ap = personName(a, isStudent);
        const bp = personName(b, isStudent);
        return ap.localeCompare(bp);
      }
      default:
        return 0;
    }
  };
}

// Render the counterpart name on a task — for a STUDENT viewer that's the
// supervisor who set the task (assignedBy); for a SUPERVISOR viewer that's
// the intern the task belongs to (studentId.userId). Both fields can be
// populated on the same task doc (a student is BOTH the student AND has an
// assignedBy supervisor), so we MUST key off the viewer's role rather than
// "whichever populates" — picking the wrong one is exactly the bug that put
// the student's own name in the "Assigned by" column.
function personName(t, isStudent) {
  if (isStudent) {
    if (t.assignedBy) {
      return `${t.assignedBy.firstName || ''} ${t.assignedBy.lastName || ''}`.trim();
    }
    return '';
  }
  if (t.studentId?.userId) {
    return `${t.studentId.userId.firstName || ''} ${t.studentId.userId.lastName || ''}`.trim();
  }
  return '';
}

// ── Sortable header cell ─────────────────────────────────────────────────
function Th({ children, sortKey, sort, onSort, align = 'left' }) {
  const active = sort.key === sortKey;
  const dir = active ? sort.dir : 0;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        textAlign: align,
        padding: '12px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span
        className="inline-flex items-center gap-1"
        style={{ color: active ? 'var(--text-secondary)' : undefined }}
      >
        {children}
        {dir === 1 && <ChevronUp size={12} strokeWidth={2} />}
        {dir === -1 && <ChevronDown size={12} strokeWidth={2} />}
      </span>
    </th>
  );
}

// ── Submission pill ──────────────────────────────────────────────────────
function SubmissionPill({ task }) {
  if (task.submission?.submittedAt) {
    return <Badge tone="success" dot>submitted</Badge>;
  }
  if (task.status === 'overdue') {
    return <Badge tone="danger" dot>missed</Badge>;
  }
  return <Badge tone="neutral">pending</Badge>;
}

// ── Deliverables column ──────────────────────────────────────────────────
function Deliverables({ task }) {
  const kinds = requiredKinds(task);
  if (kinds.length === 0) {
    return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {kinds.map((k) => (
        <span
          key={k}
          className="t-mono"
          style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {k}
        </span>
      ))}
    </span>
  );
}

// ── Appeal flag ──────────────────────────────────────────────────────────
function AppealFlag({ task }) {
  const status = task.gradeAppeal?.status;
  if (!status) return null;
  const tone =
    status === 'pending' ? 'warning' : status === 'adjusted' ? 'success' : 'neutral';
  return (
    <Badge tone={tone} dot style={{ marginLeft: 6 }}>
      appeal {status}
    </Badge>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function TasksTable({
  tasks,
  isStudent,
  onOpen,
}) {
  const [sort, setSort] = useState({ key: 'tag', dir: 1 });
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the visible task set changes upstream.
  // The parent filters; we just sort + paginate.
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const sorted = useMemo(() => {
    if (!sort.key) return tasks;
    const cmp = sorter(sort.key, isStudent);
    return [...tasks].sort((a, b) => cmp(a, b) * sort.dir);
  }, [tasks, sort]);

  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(start, start + PAGE_SIZE);

  function onSort(key) {
    setSort((cur) => {
      if (cur.key !== key) return { key, dir: 1 };
      if (cur.dir === 1) return { key, dir: -1 };
      return { key: null, dir: 0 };
    });
    setPage(1);
  }

  // Empty state.
  if (total === 0) {
    return (
      <div
        className="rounded-lg p-10 text-center"
        style={{
          background: 'var(--bg-raised)',
          boxShadow: '0 0 0 1px var(--border-subtle)',
          color: 'var(--text-tertiary)',
          fontSize: 13,
        }}
      >
        No tasks match your filters.
      </div>
    );
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div
        className="hidden md:block overflow-hidden"
        style={{
          background: 'var(--bg-raised)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 0 1px var(--border-subtle)',
        }}
      >
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                <Th sortKey="tag" sort={sort} onSort={onSort}>Tag</Th>
                <Th sortKey="title" sort={sort} onSort={onSort}>Title</Th>
                <Th sortKey="person" sort={sort} onSort={onSort}>
                  {isStudent ? 'Assigned by' : 'Intern'}
                </Th>
                <Th sortKey="status" sort={sort} onSort={onSort}>Status</Th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Required
                </th>
                <Th sortKey="submission" sort={sort} onSort={onSort}>Submission</Th>
                <Th sortKey="score" sort={sort} onSort={onSort} align="right">Score</Th>
                <Th sortKey="deadline" sort={sort} onSort={onSort}>Deadline</Th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '12px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((task, i) => {
                const max = task.maxScore ?? 100;
                const overdue = task.status === 'overdue' ||
                  (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
                return (
                  <tr
                    key={task._id}
                    onClick={() => onOpen(task)}
                    className="cursor-pointer"
                    style={{
                      borderTop: i ? '1px solid var(--border-subtle)' : 0,
                      transition: 'background-color var(--dur-fast) var(--ease-emphasis)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td
                      style={{
                        padding: '14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.tag || '—'}
                    </td>
                    <td style={{ padding: '14px', maxWidth: 320 }}>
                      <div
                        className="t-body-md truncate"
                        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                      {task.gradeAppeal?.status && <AppealFlag task={task} />}
                    </td>
                    <td
                      style={{
                        padding: '14px',
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                        maxWidth: 160,
                      }}
                    >
                      <span
                        className="truncate inline-block w-full"
                        title={personName(task, isStudent)}
                      >
                        {personName(task, isStudent) || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Badge tone={STATUS_TONE[task.status]}>{label(task.status)}</Badge>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Deliverables task={task} />
                    </td>
                    <td style={{ padding: '14px' }}>
                      <SubmissionPill task={task} />
                    </td>
                    <td
                      style={{
                        padding: '14px',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color:
                          task.gradedAt
                            ? 'var(--text-primary)'
                            : 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.gradedAt ? `${task.score} / ${max}` : `— / ${max}`}
                    </td>
                    <td
                      style={{
                        padding: '14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: overdue ? 'var(--danger-600)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDate(task.deadline)}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        trailing={<ArrowUpRight size={14} strokeWidth={1.8} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(task);
                        }}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-3">
        {pageRows.map((task) => {
          const max = task.maxScore ?? 100;
          return (
            <button
              key={task._id}
              type="button"
              onClick={() => onOpen(task)}
              className="flex flex-col gap-2 rounded-lg p-4 text-left"
              style={{
                background: 'var(--bg-raised)',
                boxShadow: '0 0 0 1px var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span
                    className="t-mono"
                    style={{ fontSize: 11, color: 'var(--text-tertiary)' }}
                  >
                    {task.tag || '—'}
                  </span>
                  <div
                    className="t-body-md truncate"
                    style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    {task.title}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[task.status]}>{label(task.status)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <SubmissionPill task={task} />
                {task.gradeAppeal?.status && <AppealFlag task={task} />}
              </div>
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 t-mono"
                style={{ fontSize: 11, color: 'var(--text-tertiary)' }}
              >
                <span>{fmtDate(task.deadline)}</span>
                <span>{task.gradedAt ? `${task.score} / ${max}` : `— / ${max}`}</span>
                {personName(task, isStudent) && (
                  <span className="truncate">{personName(task, isStudent)}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pager */}
      {total > PAGE_SIZE && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leading={<ChevronLeft size={14} strokeWidth={1.8} />}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span
              className="t-mono"
              style={{ color: 'var(--text-secondary)', fontSize: 12 }}
            >
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              trailing={<ChevronRight size={14} strokeWidth={1.8} />}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
