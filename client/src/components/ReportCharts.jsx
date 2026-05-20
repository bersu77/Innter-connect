// Interactive analytical charts for a generated report. Every report carries a
// `summary` (named metrics) and `rows`; the summary always yields a bar chart,
// and when the rows carry a `status` field a status breakdown pie is added too.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card } from './ui';

const labelize = (s) => (s || '').replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

// Accent palette for the pie segments.
const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

export default function ReportCharts({ summary = {}, rows = [] }) {
  const summaryData = Object.entries(summary).map(([key, value]) => ({
    name: labelize(key),
    value: Number(value) || 0,
  }));
  if (summaryData.length === 0) return null;

  // A status breakdown is shown when the report's rows carry a `status` field.
  const hasStatus = rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'status');
  const statusData = hasStatus
    ? Object.entries(
        rows.reduce((acc, r) => {
          const key = String(r.status || 'unknown');
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className={statusData.length > 0 ? 'grid gap-4 lg:grid-cols-2' : ''}>
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Summary metrics</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={summaryData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={56}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {statusData.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Status breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={88}
                label={(d) => `${d.name}: ${d.value}`}
              >
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
