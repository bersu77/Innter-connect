// ReportCharts — design-system v2. Every report carries a `summary` (named
// metrics) and `rows`; the summary yields a bar chart, and when the rows carry
// a `status` field a status-breakdown pie is added. Colours come from the v2
// chart tokens (--chart-1…5, --chart-grid, --chart-axis) so light/dark just
// re-resolve.
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

const labelize = (s) =>
  (s || '').replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const PIE_TOKENS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const AXIS_TICK = { fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--chart-axis)' };

export default function ReportCharts({ summary = {}, rows = [] }) {
  const summaryData = Object.entries(summary).map(([key, value]) => ({
    name: labelize(key),
    value: Number(value) || 0,
  }));
  if (summaryData.length === 0) return null;

  const hasStatus =
    rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'status');
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
      <Card style={{ padding: 20 }}>
        <span className="t-eyebrow">Summary metrics</span>
        <div style={{ marginTop: 10 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summaryData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={56}
                stroke="var(--chart-grid)"
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                stroke="var(--chart-grid)"
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--brand-500) 8%, transparent)' }}
                contentStyle={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-2)',
                }}
                labelStyle={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {statusData.length > 0 && (
        <Card style={{ padding: 20 }}>
          <span className="t-eyebrow">Status breakdown</span>
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  strokeWidth={0}
                  label={(d) => `${d.name}: ${d.value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_TOKENS[i % PIE_TOKENS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-2)',
                  }}
                />
                <Legend
                  iconType="square"
                  wrapperStyle={{
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
