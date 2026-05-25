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
  return (
    <div
      className="rounded-md p-3"
      style={{
        background: 'var(--brand-50)',
        boxShadow: 'inset 0 0 0 1px var(--brand-100)',
      }}
    >
      <div
        className="t-eyebrow"
        style={{ color: 'var(--brand-700)' }}
      >
        Grade
      </div>
      <div
        className="t-display-sm"
        style={{ color: 'var(--brand-700)', marginTop: 2 }}
      >
        {task.score} / {max}
      </div>
      {task.feedback && (
        <p
          className="mt-2 whitespace-pre-line t-body-sm"
          style={{ color: 'var(--brand-700)' }}
        >
          {task.feedback}
        </p>
      )}
      <div
        className="t-caption"
        style={{ marginTop: 6, color: 'var(--brand-700)' }}
      >
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
function GradeForm({ task, onGrade, onAfter }) {
  const max = task.maxScore ?? 100;
  const [score, setScore] = useState(task.score ?? '');
  const [feedback, setFeedback] = useState(task.feedback || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    setErr('');
    if (score === '' || Number.isNaN(Number(score))) {
      setErr('Enter a numeric score.');
      return;
    }
    setBusy(true);
    try {
      await onGrade(task._id, Number(score), feedback);
      onAfter?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not save the grade.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={`Score (out of ${max})`}
        type="number"
        min="0"
        max={max}
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      <Textarea
        label="Feedback"
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Comment on the student's work…"
      />
      {err && (
        <p className="t-caption" style={{ color: 'var(--danger-600)' }}>
          {err}
        </p>
      )}
      <div className="flex justify-end">
        <Button loading={busy} onClick={go}>
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
