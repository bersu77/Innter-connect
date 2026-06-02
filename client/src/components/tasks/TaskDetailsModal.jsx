// TaskDetailsModal — focused detail surface for a single task.
//
// One modal type, role-aware. Renders:
//   • Header — TSK-XXXX tag, title, status badge, deadline, max-score.
//   • Description (read-only).
//   • Required deliverables (chips).
//   • Submission block — what the student turned in (read-only, both roles).
//   • Graded block — score + supervisor feedback once graded.
//   • Appeal block — the appeal thread + the student's reason + documents
//     once an appeal exists.
//   • Action panel — context-sensitive:
//       student / not yet completed → SubmissionForm (+ "Start" button when
//         status==='assigned').
//       supervisor / submitted-but-not-finalised → GradeForm.
//       student / graded & no appeal → "Appeal this grade" form.
//       supervisor / appeal pending → "Resolve appeal" form.
//
// The page passes the task + role + handlers; the modal handles state for
// its inputs only. Submission/grade/appeal/resolve handlers reload data on
// the page side; this modal closes itself afterwards via onClose.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Paperclip, Link as LinkIcon, FileText } from 'lucide-react';
import { Badge, Button, Input, Textarea } from '../ui';

const STATUS_TONE = {
  assigned: 'neutral',
  in_progress: 'brand',
  completed: 'success',
  overdue: 'danger',
};
const APPEAL_TONE = { pending: 'warning', upheld: 'neutral', adjusted: 'success' };
const label = (s) => (s || '').replace(/_/g, ' ');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

function requiredKinds(task) {
  const r = task.requiredDeliverables || {};
  return [r.document && 'doc', r.link && 'link', r.note && 'note'].filter(Boolean);
}

// ── Section header ───────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      className="t-eyebrow"
      style={{ marginTop: 18, marginBottom: 8 }}
    >
      {children}
    </div>
  );
}

// ── Submission block (read-only) ─────────────────────────────────────────
function SubmissionBlock({ submission }) {
  if (!submission?.submittedAt) return null;
  return (
    <div
      className="rounded-md p-3"
      style={{
        background: 'var(--bg-subtle)',
        boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      }}
    >
      <div
        className="t-caption"
        style={{ color: 'var(--text-tertiary)', marginBottom: 6 }}
      >
        Submitted {fmtDateTime(submission.submittedAt)}
      </div>
      {submission.documentPath && (
        <a
          href={submission.documentPath}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 t-body-sm"
          style={{ color: 'var(--brand-600)', borderBottom: 'none' }}
        >
          <Paperclip size={14} strokeWidth={1.6} />
          {submission.documentName || 'Download document'}
        </a>
      )}
      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center gap-2 break-all t-body-sm"
          style={{ color: 'var(--brand-600)', borderBottom: 'none' }}
        >
          <LinkIcon size={14} strokeWidth={1.6} />
          {submission.link}
        </a>
      )}
      {submission.note && (
        <p
          className="mt-2 whitespace-pre-line t-body-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {submission.note}
        </p>
      )}
    </div>
  );
}

// ── Graded block ─────────────────────────────────────────────────────────
function GradedBlock({ task }) {
  if (!task.gradedAt) return null;
  const max = task.maxScore ?? 100;
  const hasRubric = Array.isArray(task.rubric) && task.rubric.length > 0;
  return (
    <div
      className="rounded-md p-3"
      style={{
        background: 'var(--brand-50)',
        boxShadow: 'inset 0 0 0 1px var(--brand-100)',
      }}
    >
      <div className="t-eyebrow" style={{ color: 'var(--brand-700)' }}>
        Grade
      </div>
      <div
        className="t-display-sm"
        style={{ color: 'var(--brand-700)', marginTop: 2 }}
      >
        {task.score} / {max}
      </div>
      {hasRubric && (
        <table
          className="mt-3 w-full text-sm"
          style={{ color: 'var(--brand-700)', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-100)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>
                Criterion
              </th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500, width: 80 }}>
                Score
              </th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500, width: 60 }}>
                Max
              </th>
            </tr>
          </thead>
          <tbody>
            {task.rubric.map((r, i) => (
              <tr
                key={i}
                style={{ borderBottom: i === task.rubric.length - 1 ? 0 : '1px solid var(--brand-100)' }}
              >
                <td style={{ padding: '6px 0' }}>{r.criterion}</td>
                <td
                  style={{
                    padding: '6px 0',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {r.score}
                </td>
                <td
                  style={{
                    padding: '6px 0',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.7,
                  }}
                >
                  / {r.maxScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {task.feedback && (
        <p
          className="mt-3 whitespace-pre-line t-body-sm"
          style={{ color: 'var(--brand-700)' }}
        >
          {task.feedback}
        </p>
      )}
      <div className="t-caption" style={{ marginTop: 8, color: 'var(--brand-700)' }}>
        Graded {fmtDateTime(task.gradedAt)}
      </div>
    </div>
  );
}

// ── Appeal block — shows the existing appeal thread (read-only piece) ───
function AppealBlock({ task }) {
  const appeal = task.gradeAppeal?.submittedAt ? task.gradeAppeal : null;
  if (!appeal) return null;
  return (
    <div
      className="rounded-md p-3"
      style={{
        background: 'var(--warning-50)',
        boxShadow: 'inset 0 0 0 1px var(--warning-100)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="t-eyebrow"
          style={{ color: 'var(--warning-700)' }}
        >
          Grade appeal
        </span>
        <Badge tone={APPEAL_TONE[appeal.status]}>{appeal.status}</Badge>
      </div>
      <p
        className="mt-2 whitespace-pre-line t-body-sm"
        style={{ color: 'var(--warning-700)' }}
      >
        “{appeal.reason}”
      </p>
      {appeal.documents?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {appeal.documents.map((d, i) => (
            <a
              key={i}
              href={d.path}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 t-body-sm"
              style={{ color: 'var(--brand-700)', borderBottom: 'none' }}
            >
              <Paperclip size={12} strokeWidth={1.6} />
              {d.filename}
            </a>
          ))}
        </div>
      )}
      {appeal.response && (
        <p
          className="mt-2 whitespace-pre-line t-body-sm"
          style={{
            color: 'var(--text-secondary)',
            paddingTop: 8,
            borderTop: '1px solid var(--warning-100)',
          }}
        >
          <strong>Supervisor response:</strong> {appeal.response}
        </p>
      )}
    </div>
  );
}

// ── Student submission form ──────────────────────────────────────────────
function SubmissionForm({ task, onSubmit, onAfter }) {
  const req = task.requiredDeliverables || {};
  const reqKinds = requiredKinds(task);
  const [link, setLink] = useState(task.submission?.link || '');
  const [note, setNote] = useState(task.submission?.note || '');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const star = <span style={{ color: 'var(--danger-500)' }}>*</span>;

  async function go(e) {
    e.preventDefault();
    setErr('');
    if (req.document && !file && !task.submission?.documentPath) {
      setErr('A document is required for this task.');
      return;
    }
    if (req.link && !link.trim()) {
      setErr('A link is required for this task.');
      return;
    }
    if (req.note && !note.trim()) {
      setErr('A note is required for this task.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(task._id, { document: file, link, note });
      onAfter?.();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="flex flex-col gap-3">
      <p className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
        Submit your work{reqKinds.length ? ` — required: ${reqKinds.join(', ')}` : ' — attach anything optional'}
      </p>
      <div>
        <label
          className="mb-1 block t-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          Document {req.document && star}
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0] || null)}
          className="block w-full text-sm"
          style={{ color: 'var(--text-secondary)' }}
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
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything the supervisor should know…"
      />
      {err && (
        <p className="t-caption" style={{ color: 'var(--danger-600)' }}>
          {err}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>
          Submit task
        </Button>
      </div>
    </form>
  );
}

// ── Supervisor grade form ────────────────────────────────────────────────
//
// Rubric-based: the supervisor builds a list of criteria, each with a max
// weight (out of 100) and the student's awarded score. The criteria's
// `maxScore` MUST sum to exactly 100 before the grade can be saved; the
// student's total score = sum of awarded scores.
//
// Common criteria are offered as a one-click "Add" picker. The supervisor
// can also type a custom criterion name, change weights, remove rows.

const SUGGESTED_CRITERIA = [
  'Understanding of the task',
  'Accuracy / correctness',
  'Depth / quality of work',
  'Clarity & communication',
  'Completeness / effort',
  'Originality',
  'Presentation / organization',
  'Critical thinking',
  'Timely delivery',
];

// Default rubric for first-time graders — 4 balanced criteria, sum = 100.
const DEFAULT_RUBRIC = () => [
  { criterion: 'Accuracy / correctness',  maxScore: 30, score: '' },
  { criterion: 'Depth / quality of work', maxScore: 30, score: '' },
  { criterion: 'Completeness / effort',   maxScore: 20, score: '' },
  { criterion: 'Timely delivery',         maxScore: 20, score: '' },
];

function GradeForm({ task, onGrade, onAfter }) {
  // Seed from the existing rubric on the task when re-grading; otherwise
  // start from the default 4-row scaffold.
  const [rows, setRows] = useState(() =>
    Array.isArray(task.rubric) && task.rubric.length > 0
      ? task.rubric.map((r) => ({
          criterion: r.criterion,
          maxScore: r.maxScore,
          score: r.score ?? '',
        }))
      : DEFAULT_RUBRIC(),
  );
  const [feedback, setFeedback] = useState(task.feedback || '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const totalMax = rows.reduce((a, r) => a + (Number(r.maxScore) || 0), 0);
  const totalScore = rows.reduce((a, r) => a + (Number(r.score) || 0), 0);
  const maxOk = totalMax === 100;

  function setRow(i, patch) {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i) {
    setRows((cur) => cur.filter((_, idx) => idx !== i));
  }
  function addRow(criterion = '', maxScore = 10) {
    setRows((cur) => [...cur, { criterion, maxScore, score: '' }]);
  }
  function resetDefault() {
    setRows(DEFAULT_RUBRIC());
  }

  async function go() {
    setErr('');
    if (rows.length === 0) {
      setErr('Add at least one criterion before saving.');
      return;
    }
    if (!maxOk) {
      setErr(`Criterion max scores must sum to 100 (currently ${totalMax}).`);
      return;
    }
    for (const r of rows) {
      if (!r.criterion?.trim()) {
        setErr('Every criterion needs a name.');
        return;
      }
      const s = Number(r.score);
      if (r.score === '' || Number.isNaN(s) || s < 0 || s > Number(r.maxScore)) {
        setErr(`Score for "${r.criterion}" must be 0..${r.maxScore}.`);
        return;
      }
    }
    setBusy(true);
    try {
      await onGrade(task._id, {
        rubric: rows.map((r) => ({
          criterion: r.criterion.trim(),
          maxScore: Number(r.maxScore),
          score: Number(r.score),
        })),
        feedback,
      });
      onAfter?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not save the grade.');
    } finally {
      setBusy(false);
    }
  }

  const usedNames = new Set(rows.map((r) => r.criterion.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <p className="t-caption" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
        Break the score across criteria. Weights (max) must sum to <strong>100</strong>;
        the student's total is the sum of awarded scores.
      </p>

      {/* Header row */}
      <div
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: '1fr 80px 80px 28px' }}
      >
        <span className="t-eyebrow">Criterion</span>
        <span className="t-eyebrow" style={{ textAlign: 'center' }}>Max</span>
        <span className="t-eyebrow" style={{ textAlign: 'center' }}>Score</span>
        <span />
      </div>

      {rows.map((r, i) => (
        <div
          key={i}
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: '1fr 80px 80px 28px' }}
        >
          <input
            className="input"
            value={r.criterion}
            onChange={(e) => setRow(i, { criterion: e.target.value })}
            placeholder="e.g. Accuracy / correctness"
            style={{ height: 36 }}
          />
          <input
            className="input"
            type="number"
            min="1"
            max="100"
            value={r.maxScore}
            onChange={(e) => setRow(i, { maxScore: Number(e.target.value) || 0 })}
            style={{ height: 36, textAlign: 'center', padding: '0 8px' }}
          />
          <input
            className="input"
            type="number"
            min="0"
            max={r.maxScore}
            value={r.score}
            onChange={(e) => setRow(i, { score: e.target.value })}
            style={{ height: 36, textAlign: 'center', padding: '0 8px' }}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Remove criterion"
            className="btn btn-ghost btn-sm"
            style={{ width: 28, height: 28, padding: 0 }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      ))}

      {/* Add controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPickerOpen((o) => !o)}
          >
            + Add a common criterion
          </Button>
          {pickerOpen && (
            <div
              className="absolute z-10 mt-1 overflow-hidden"
              style={{
                background: 'var(--bg-raised)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-3), 0 0 0 1px var(--border-default)',
                minWidth: 240,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {SUGGESTED_CRITERIA.map((s) => {
                const taken = usedNames.has(s.toLowerCase());
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={taken}
                    onClick={() => {
                      addRow(s, 10);
                      setPickerOpen(false);
                    }}
                    className="block w-full text-left t-body-sm"
                    style={{
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 0,
                      cursor: taken ? 'not-allowed' : 'pointer',
                      color: taken ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    }}
                  >
                    {s}{taken ? '  · added' : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addRow('', 10)}
        >
          + Custom criterion
        </Button>
        <Button variant="ghost" size="sm" onClick={resetDefault}>
          Reset to default
        </Button>
      </div>

      {/* Live totals */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-md p-3"
        style={{
          background: maxOk ? 'var(--success-50)' : 'var(--warning-50)',
          color: maxOk ? 'var(--success-700)' : 'var(--warning-700)',
        }}
      >
        <span className="t-body-sm" style={{ fontWeight: 500 }}>
          Max: {totalMax} / 100 {maxOk ? '✓' : `(${totalMax > 100 ? 'over' : 'short'} by ${Math.abs(100 - totalMax)})`}
        </span>
        <span className="t-body-sm" style={{ fontWeight: 500 }}>
          Awarded: {totalScore} / 100
        </span>
      </div>

      <Textarea
        label="Feedback (optional)"
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Overall comment on the student's work…"
      />
      {err && (
        <p className="t-caption" style={{ color: 'var(--danger-600)' }}>{err}</p>
      )}
      <div className="flex justify-end">
        <Button loading={busy} onClick={go} disabled={!maxOk}>
          {task.gradedAt ? 'Update grade' : 'Save grade'}
        </Button>
      </div>
    </div>
  );
}

// ── Appeal form (student) ────────────────────────────────────────────────
function AppealForm({ task, onAppeal, onAfter }) {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    setErr('');
    if (!reason.trim()) {
      setErr('Please explain why you are appealing.');
      return;
    }
    setBusy(true);
    try {
      await onAppeal(task._id, reason, files);
      onAfter?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not file the appeal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Why are you appealing?"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain calmly and specifically what was misunderstood…"
      />
      <div>
        <label
          className="mb-1 block t-label"
          style={{ color: 'var(--text-secondary)' }}
        >
          Supporting documents (optional)
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles([...e.target.files])}
          className="block w-full text-sm"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
      {err && (
        <p className="t-caption" style={{ color: 'var(--danger-600)' }}>
          {err}
        </p>
      )}
      <div className="flex justify-end">
        <Button loading={busy} onClick={go}>
          Submit appeal
        </Button>
      </div>
    </div>
  );
}

// ── Resolve appeal (supervisor) ──────────────────────────────────────────
function ResolveAppealForm({ task, onResolve, onAfter }) {
  const max = task.maxScore ?? 100;
  const [response, setResponse] = useState('');
  const [score, setScore] = useState(task.score ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go(adjust) {
    setErr('');
    if (!response.trim()) {
      setErr('Write a short response to the appeal.');
      return;
    }
    setBusy(true);
    try {
      const payload = adjust
        ? { response, score: Number(score), feedback: task.feedback }
        : { response };
      await onResolve(task._id, payload);
      onAfter?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not resolve the appeal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Response to the student"
        rows={3}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Explain your decision…"
      />
      <Input
        label={`Adjusted score (out of ${max}) — leave to uphold`}
        type="number"
        min="0"
        max={max}
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      {err && (
        <p className="t-caption" style={{ color: 'var(--danger-600)' }}>
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" loading={busy} onClick={() => go(false)}>
          Uphold grade
        </Button>
        <Button loading={busy} onClick={() => go(true)}>
          Adjust to {score || '—'}
        </Button>
      </div>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────
export default function TaskDetailsModal({
  task,
  isStudent,
  busyId,
  onClose,
  onStart,
  onSubmit,
  onGrade,
  onAppeal,
  onResolveAppeal,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!task) return null;

  const max = task.maxScore ?? 100;
  const reqKinds = requiredKinds(task);
  const submitted = !!task.submission?.submittedAt;
  const graded = !!task.gradedAt;
  const appeal = task.gradeAppeal?.submittedAt ? task.gradeAppeal : null;

  // Which action panel to render at the bottom.
  let actionPanel = null;
  let actionTitle = null;
  if (isStudent) {
    if (!graded && !['completed', 'overdue'].includes(task.status)) {
      actionTitle = 'Submit your work';
      actionPanel = (
        <>
          {task.status === 'assigned' && (
            <div style={{ marginBottom: 12 }}>
              <Button
                variant="secondary"
                size="sm"
                loading={busyId === task._id}
                onClick={() => onStart?.(task._id)}
              >
                Start task
              </Button>
            </div>
          )}
          <SubmissionForm task={task} onSubmit={onSubmit} onAfter={onClose} />
        </>
      );
    } else if (graded && !appeal) {
      actionTitle = 'Appeal this grade';
      actionPanel = <AppealForm task={task} onAppeal={onAppeal} onAfter={onClose} />;
    }
  } else {
    // supervisor
    if (appeal && appeal.status === 'pending') {
      actionTitle = 'Resolve appeal';
      actionPanel = (
        <ResolveAppealForm task={task} onResolve={onResolveAppeal} onAfter={onClose} />
      );
    } else if (submitted || graded) {
      actionTitle = graded ? 'Update grade' : 'Grade this submission';
      actionPanel = <GradeForm task={task} onGrade={onGrade} onAfter={onClose} />;
    } else if (task.status === 'overdue') {
      // overdue tasks are auto-zeroed server-side; show that.
      actionTitle = null;
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6"
      style={{
        background: 'color-mix(in srgb, var(--stone-900) 50%, transparent)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden"
        style={{
          background: 'var(--bg-raised)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          boxShadow: 'var(--shadow-4), 0 0 0 1px var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {task.tag && (
                <span
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {task.tag}
                </span>
              )}
              <Badge tone={STATUS_TONE[task.status]}>{label(task.status)}</Badge>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                fontWeight: 400,
                margin: '8px 0 0',
                color: 'var(--text-primary)',
              }}
            >
              {task.title}
            </h2>
            <div
              className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 t-caption"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span>Due {fmtDate(task.deadline)}</span>
              <span>Out of {max}</span>
              {reqKinds.length > 0 && (
                <span>Required: {reqKinds.join(', ')}</span>
              )}
              {(isStudent ? task.assignedBy : task.studentId?.userId) && (
                <span>
                  {isStudent
                    ? `Assigned by ${task.assignedBy.firstName} ${task.assignedBy.lastName}`
                    : `Assigned to ${task.studentId.userId.firstName} ${task.studentId.userId.lastName}`}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm shrink-0"
            style={{ width: 32, height: 32, padding: 0 }}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Scrolling body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {task.description && (
            <>
              <SectionLabel>Description</SectionLabel>
              <p
                className="whitespace-pre-line t-body-md"
                style={{ color: 'var(--text-secondary)', margin: 0 }}
              >
                {task.description}
              </p>
            </>
          )}

          {submitted && (
            <>
              <SectionLabel>Submission</SectionLabel>
              <SubmissionBlock submission={task.submission} />
            </>
          )}

          {graded && (
            <>
              <SectionLabel>Result</SectionLabel>
              <GradedBlock task={task} />
            </>
          )}

          {appeal && (
            <>
              <SectionLabel>Appeal</SectionLabel>
              <AppealBlock task={task} />
            </>
          )}

          {actionPanel && (
            <>
              <SectionLabel>{actionTitle}</SectionLabel>
              {actionPanel}
            </>
          )}

          {!actionPanel && !submitted && !graded && (
            <p
              className="t-caption"
              style={{ marginTop: 18, color: 'var(--text-tertiary)' }}
            >
              <FileText size={14} strokeWidth={1.6} style={{ display: 'inline', marginRight: 4 }} />
              Nothing to act on yet.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
