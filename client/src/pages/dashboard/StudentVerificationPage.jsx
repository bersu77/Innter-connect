import { useEffect, useState } from 'react';
import { universityApi } from '../../api/profile';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

const TONE = { verified: 'success', pending: 'warning', unverified: 'neutral', rejected: 'danger' };

export default function StudentVerificationPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const statusOptions = [
    ...new Set(students.map((s) => s.verificationStatus).filter(Boolean)),
  ].sort();
  const majorOptions = [...new Set(students.map((s) => s.major).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const visible = students.filter((s) => {
    if (filters.status && s.verificationStatus !== filters.status) return false;
    if (filters.major && s.major !== filters.major) return false;
    if (!query) return true;
    const name = s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : '';
    return [name, s.userId?.email, s.studentId, s.major]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { students: list } = await universityApi.listStudents();
      setStudents(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    setBusyId(id);
    setError('');
    try {
      await universityApi.verifyStudent(id, decision);
      setStudents((list) =>
        list.map((s) =>
          s._id === id ? { ...s, verificationStatus: decision === 'approved' ? 'verified' : 'rejected' } : s,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify the academic standing of students enrolled at your university.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!loading && students.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search students by name, ID or major…"
          filters={[
            { key: 'status', label: 'Statuses', options: statusOptions },
            { key: 'major', label: 'Majors', options: majorOptions },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Major</th>
                  <th className="px-4 py-3 font-medium">GPA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {s.userId?.firstName} {s.userId?.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{s.studentId || s.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.major || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{s.gpa ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TONE[s.verificationStatus] || 'neutral'}>
                        {s.verificationStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.verificationStatus !== 'verified' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            loading={busyId === s._id}
                            onClick={() => decide(s._id, 'approved')}
                          >
                            Verify
                          </Button>
                          {s.verificationStatus !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busyId === s._id}
                              onClick={() => decide(s._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No students enrolled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
