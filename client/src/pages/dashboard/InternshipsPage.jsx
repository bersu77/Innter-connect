import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { internshipApi } from '../../api/internships';
import { Badge, Button, Card, Input, Spinner } from '../../components/ui';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';

const STATUS_TONE = { active: 'success', draft: 'neutral', closed: 'warning', archived: 'neutral' };

function InternshipCard({ internship }) {
  return (
    <Link to={`/dashboard/internships/${internship._id}`}>
      <Card className="p-5 transition-shadow duration-200 hover:shadow-soft-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800">{internship.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {internship.companyId?.name || 'Your company'}
            </p>
          </div>
          <Badge tone={STATUS_TONE[internship.status]}>{internship.status}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{internship.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          {internship.locations?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {internship.locations.join(', ')}
            </span>
          )}
          {internship.position?.type && <span className="capitalize">· {internship.position.type}</span>}
          {internship.position?.paid && <span>· Paid</span>}
        </div>
      </Card>
    </Link>
  );
}

export default function InternshipsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCompany = (user?.userType ?? user?.role) === 'company';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const statusOptions = [...new Set(items.map((i) => i.status).filter(Boolean))].sort();
  const typeOptions = [...new Set(items.map((i) => i.position?.type).filter(Boolean))].sort();
  const visible = items.filter(
    (i) =>
      (!filters.status || i.status === filters.status) &&
      (!filters.type || i.position?.type === filters.type),
  );

  async function load(term = '') {
    setLoading(true);
    try {
      const data = isCompany
        ? await internshipApi.listMine()
        : await internshipApi.list(term ? { search: term } : {});
      setItems(data.internships || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={isCompany ? 'My postings' : 'Discover'}
        title={isCompany ? 'My internships' : 'Browse internships'}
        lede={
          isCompany
            ? 'Create and manage your internship postings.'
            : 'Discover internship opportunities that match your skills.'
        }
        meta={items.length ? `${items.length} ${items.length === 1 ? 'posting' : 'postings'}` : null}
        actions={
          isCompany && (
            <Button
              onClick={() => navigate('/dashboard/post-internship')}
              leading={<Plus className="h-4 w-4" />}
            >
              Post internship
            </Button>
          )
        }
      />

      {!isCompany && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search);
          }}
          className="flex gap-2"
        >
          <Input
            className="flex-1"
            placeholder="Search by title, skill or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      )}

      {!loading && items.length > 0 && (
        <FilterBar
          filters={[
            { key: 'status', label: 'Statuses', options: statusOptions },
            { key: 'type', label: 'Types', options: typeOptions },
          ]}
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          {isCompany
            ? 'No postings yet. Create your first internship.'
            : 'No internships found. Try a different search.'}
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No internships match your filters.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((it) => (
            <InternshipCard key={it._id} internship={it} />
          ))}
        </div>
      )}
    </div>
  );
}
