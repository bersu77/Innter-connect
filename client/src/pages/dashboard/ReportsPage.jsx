import { useEffect, useState } from 'react';
import { Download, FileBarChart } from 'lucide-react';
import { reportApi } from '../../api/reports';
import { Button, Card, Spinner } from '../../components/ui';

const labelize = (s) =>
  (s || '').replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function loadList() {
    try {
      const { reports: list } = await reportApi.list();
      setReports(list || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const { report } = await reportApi.generate();
      await loadList();
      setSelected(report);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate the report.');
    } finally {
      setGenerating(false);
    }
  }

  async function open(id) {
    setError('');
    try {
      const { report } = await reportApi.get(id);
      setSelected(report);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the report.');
    }
  }

  const summary = selected?.payload?.summary || {};
  const rows = selected?.payload?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate placement, recruitment, and system reports.
          </p>
        </div>
        <Button loading={generating} onClick={generate}>
          <FileBarChart className="h-4 w-4" />
          Generate report
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <>
          {reports.length > 0 && (
            <Card className="overflow-hidden">
              <div className="divide-y divide-slate-50">
                {reports.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => open(r._id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                      selected?._id === r._id ? 'bg-brand-50/50' : ''
                    }`}
                  >
                    <span className="font-medium text-slate-800">{r.title}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(r.generatedAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{selected.title}</h2>
                <div className="flex gap-2">
                  {['csv', 'xlsx', 'pdf'].map((fmt) => (
                    <Button
                      key={fmt}
                      variant="secondary"
                      size="sm"
                      onClick={() => reportApi.download(selected._id, fmt)}
                    >
                      <Download className="h-4 w-4" />
                      {fmt.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(summary).map(([key, value]) => (
                  <Card key={key} className="p-4">
                    <p className="text-xs text-slate-500">{labelize(key)}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
                  </Card>
                ))}
              </div>

              {rows.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                          {columns.map((c) => (
                            <th key={c} className="px-4 py-3 font-medium">
                              {labelize(c)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            {columns.map((c) => (
                              <td key={c} className="px-4 py-3 text-slate-600">
                                {String(row[c] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {reports.length === 0 && !selected && (
            <Card className="p-10 text-center text-sm text-slate-400">
              No reports yet. Generate your first report above.
            </Card>
          )}
        </>
      )}
    </div>
  );
}
