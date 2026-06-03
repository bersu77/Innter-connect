import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : null);

function Field({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">{value}</dd>
    </div>
  );
}

function CompanyProfile({ org }) {
  const u = org.userId || {};
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Company profile</p>
      {org.logo && <img src={org.logo} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" />}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <Field label="Company name" value={org.name} />
        <Field label="Industry" value={org.industry} />
        <Field label="Employees" value={org.employees} />
        <Field label="Founded" value={org.founded} />
        <Field label="Country" value={org.country} />
        <Field label="City" value={org.city} />
        <Field label="Email" value={org.email} />
        <Field label="Registered by" value={[u.firstName, u.lastName].filter(Boolean).join(' ') || null} />
        <Field label="Account email" value={u.email} />
      </dl>
      {org.website && (
        <div>
          <dt className="text-xs text-slate-400">Website</dt>
          <dd>
            <a href={org.website} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline break-all">
              {org.website}
            </a>
          </dd>
        </div>
      )}
      {org.description && (
        <div>
          <p className="text-xs text-slate-400">Description</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{org.description}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {fmt(org.createdAt) && <span>Joined {fmt(org.createdAt)}</span>}
        {fmt(org.updatedAt) && <span>Last updated {fmt(org.updatedAt)}</span>}
      </div>
    </div>
  );
}

function UniversityProfile({ org }) {
  const u = org.userId || {};
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">University profile</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <Field label="University name" value={org.name} />
        <Field label="Domain" value={org.domain} />
        <Field label="Accreditation code" value={org.accreditationCode} />
        <Field label="Country" value={org.country} />
        <Field label="City" value={org.city} />
        <Field label="Address" value={org.address} />
        <Field label="Phone" value={org.phone} />
        <Field label="Email" value={org.email} />
        <Field label="Student count" value={org.studentCount || null} />
        <Field label="Registered by" value={[u.firstName, u.lastName].filter(Boolean).join(' ') || null} />
        <Field label="Account email" value={u.email} />
      </dl>
      {org.website && (
        <div>
          <dt className="text-xs text-slate-400">Website</dt>
          <dd>
            <a href={org.website} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline break-all">
              {org.website}
            </a>
          </dd>
        </div>
      )}
      {org.departments?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400">Departments</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {org.departments.map((d, i) => (
              <span key={i} className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">{d}</span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {fmt(org.createdAt) && <span>Joined {fmt(org.createdAt)}</span>}
        {fmt(org.updatedAt) && <span>Last updated {fmt(org.updatedAt)}</span>}
      </div>
    </div>
  );
}

function OrgCard({ org, busyId, onDecide }) {
  const [open, setOpen] = useState(!org.verified);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-800">{org.name}</div>
          <div className="mt-0.5 text-sm text-slate-500">
            <span className="capitalize">{org.type}</span>
            {org.city || org.country
              ? ` · ${[org.city, org.country].filter(Boolean).join(', ')}`
              : ''}
          </div>
        </div>
        <Badge tone={org.verified ? 'success' : 'warning'}>
          {org.verified ? 'verified' : 'pending'}
        </Badge>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {open ? '▾ Hide profile details' : '▸ Show profile details'}
        </button>
        {open && (org.type === 'company' ? <CompanyProfile org={org} /> : <UniversityProfile org={org} />)}
      </div>

      {!org.verified && (
        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
          <Button size="sm" loading={busyId === org._id} onClick={() => onDecide(org.type, org._id, 'approved')}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" loading={busyId === org._id} onClick={() => onDecide(org.type, org._id, 'rejected')}>
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function AdminVerificationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const orgStatus = (o) => (o.verified ? 'verified' : 'pending');
  const typeOptions = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort();
  const statusOptions = [...new Set(rows.map(orgStatus))].sort();
  const query = search.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filters.type && r.type !== filters.type) return false;
    if (filters.status && orgStatus(r) !== filters.status) return false;
    if (!query) return true;
    return [r.name, r.city, r.country].filter(Boolean).join(' ').toLowerCase().includes(query);
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { companies, universities } = await adminApi.listOrganizations();
      setRows([
        ...companies.map((c) => ({ ...c, type: 'company' })),
        ...universities.map((u) => ({ ...u, type: 'university' })),
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(type, id, decision) {
    setBusyId(id);
    setError('');
    try {
      await adminApi.verifyOrganization(type, id, decision);
      setRows((list) =>
        list.map((r) => (r._id === id ? { ...r, verified: decision === 'approved' } : r)),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and verify companies and universities on the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!loading && rows.length > 0 && (
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search organisations by name or location…"
          filters={[
            { key: 'type', label: 'Types', options: typeOptions },
            { key: 'status', label: 'Statuses', options: statusOptions },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No organizations to review.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((org) => (
            <OrgCard key={`${org.type}-${org._id}`} org={org} busyId={busyId} onDecide={decide} />
          ))}
        </div>
      )}
    </div>
  );
}
