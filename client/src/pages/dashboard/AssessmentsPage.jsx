import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../api/tasks';
import { placementApi } from '../../api/placements';
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

// Supervisor's evaluation form. Used for the first submission AND for editing
// an already-submitted assessment — when `mode === 'edit'` the inputs are
// pre-filled and a Cancel button is shown alongside Save.
function AssessmentForm({ assessment, mode = 'submit', onSubmit, onCancel }) {
  const [score, setScore] = useState(
    mode === 'edit' && assessment.score != null ? String(assessment.score) : '',
  );
  const [remarks, setRemarks] = useState(mode === 'edit' ? assessment.remarks || '' : '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSubmit(assessment._id, { score: Number(score), remarks });
    } finally {
      setBusy(false);
    }
  }

  const isEdit = mode === 'edit';

  return (
    <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
      <Input
        label="Score (0–100)"
        type="number"
        min="0"
        max="100"
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      <div className="flex items-end gap-2">
        <Button loading={busy} disabled={score === ''} onClick={submit}>
          {isEdit ? 'Save changes' : 'Submit assessment'}
        </Button>
        {isEdit && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
      <Textarea
        className="sm:col-span-2"
        label="Remarks"
        rows={3}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />
    </div>
  );
}

export default function AssessmentsPage() {
  const { user } = useAuth();
  const isStudent = (user?.userType ?? user?.role) === 'student';

  const [assessments, setAssessments] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placementId, setPlacementId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [editingId, setEditingId] = useState(null);

  const assessmentStatus = (a) => (a.submitted ? 'completed' : 'requested');
  const statusOptions = [...new Set(assessments.map(assessmentStatus))].sort();
  const query = search.trim().toLowerCase();
  const visible = assessments.filter((a) => {
    if (filters.status && assessmentStatus(a) !== filters.status) return false;
    if (!query) return true;
    const name = a.studentId?.userId
      ? `${a.studentId.userId.firstName} ${a.studentId.userId.lastName}`
      : '';
    return [name, a.remarks].filter(Boolean).join(' ').toLowerCase().includes(query);
  });

  async function load() {
    setLoading(true);
    try {
      const res = await assessmentApi.list();
      setAssessments(res.assessments || []);
      if (isStudent) {
        const placementRes = await placementApi.list();
        setPlacements(placementRes.placements || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function request() {
    if (!placementId) return;
    setRequesting(true);
    setError('');
    try {
      await assessmentApi.request(placementId);
      setPlacementId('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request assessment.');
    } finally {
      setRequesting(false);
    }
  }

  async function submit(id, data) {
    setError('');
    try {
      await assessmentApi.submit(id, data);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit assessment.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent
            ? 'Request a performance assessment and view your results.'
            : 'Complete performance assessments for the interns you supervise.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {isStudent && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Request an assessment</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Select
              className="min-w-[16rem] flex-1"
              value={placementId}
              onChange={(e) => setPlacementId(e.target.value)}
            >
              <option value="">Select a placement</option>
              {placements.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.internshipId?.title || 'Internship'} — {p.companyId?.name || ''}
                </option>
              ))}
            </Select>
            <Button loading={requesting} disabled={!placementId} onClick={request}>
              Request assessment
            </Button>
          </div>
        </Card>
      )}

      {!loading && assessments.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by student or remarks…"
          filters={[{ key: 'status', label: 'Statuses', options: statusOptions }]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : assessments.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No assessments yet.</Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No assessments match your filters.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const isEditing = editingId === a._id;
            return (
              <Card key={a._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {a.studentId?.userId
                        ? `${a.studentId.userId.firstName} ${a.studentId.userId.lastName}`
                        : 'Performance assessment'}
                    </h3>
                    {a.submitted ? (
                      <p className="mt-0.5 text-sm text-slate-500">
                        Score: {a.score}/100
                        {a.remarks ? ` — ${a.remarks}` : ''}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-slate-500">
                        Awaiting supervisor evaluation.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isStudent && a.submitted && !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(a._id)}
                      >
                        Edit
                      </Button>
                    )}
                    <Badge tone={a.submitted ? 'success' : 'warning'}>
                      {a.submitted ? 'completed' : 'requested'}
                    </Badge>
                  </div>
                </div>
                {!isStudent && !a.submitted && (
                  <AssessmentForm assessment={a} mode="submit" onSubmit={submit} />
                )}
                {!isStudent && a.submitted && isEditing && (
                  <AssessmentForm
                    assessment={a}
                    mode="edit"
                    onSubmit={submit}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
