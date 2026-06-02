// PublicInternshipsPage — anonymous browse + search + filter.
//
// No login required. Anyone visiting /internships sees the same active
// postings any signed-in student would see; the only difference is the
// "Apply" CTA on each card links into the apply flow via a login redirect
// if the visitor isn't authenticated.
//
// Reuses the existing `internshipApi.list()` — that endpoint is now served by
// `softProtect`, so it accepts both anonymous and authenticated callers and
// returns the same {status:'active'} set either way.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { internshipApi } from '../api/internships';
import { Badge, Button, Card, Input, Select, Spinner } from '../components/ui';

const TYPES = ['onsite', 'remote', 'hybrid'];
const PAGE_SIZE = 20;

export default function PublicInternshipsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  // Pagination metadata from the server — drives the pager + the "Showing
  // X–Y of Z" line. Defaulted to a coherent empty state so first paint has
  // no jumps before the first response lands.
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const load = useCallback(
    async (extras = {}) => {
      setLoading(true);
      try {
        const q = {
          page: extras.page ?? page,
          limit: PAGE_SIZE,
          ...(extras.search ?? search.trim() ? { search: extras.search ?? search.trim() } : {}),
          ...(extras.type ?? type ? { type: extras.type ?? type } : {}),
          ...(extras.location ?? location.trim() ? { location: extras.location ?? location.trim() } : {}),
        };
        const data = await internshipApi.list(q);
        setItems(data.internships || []);
        setPagination(
          data.pagination || {
            page: q.page,
            limit: PAGE_SIZE,
            total: (data.internships || []).length,
            totalPages: 1,
          },
        );
      } catch {
        setItems([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    },
    [page, search, type, location],
  );

  // First load + page change.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onSubmit(e) {
    e.preventDefault();
    // New search resets to page 1 — otherwise a deep page on a wider result
    // set could land outside the new total.
    if (page !== 1) setPage(1);
    else load({ page: 1 });
  }

  function clearAll() {
    setSearch('');
    setType('');
    setLocation('');
    if (page !== 1) setPage(1);
    else load({ page: 1, search: '', type: '', location: '' });
  }

  function goTo(nextPage) {
    setPage(Math.min(Math.max(1, nextPage), pagination.totalPages));
  }

  // Distinct location chips derived from what's currently loaded — clicking
  // one filters the list to that location without typing.
  const popularLocations = [
    ...new Set(items.flatMap((it) => it.locations || [])),
  ].slice(0, 6);

  return (
    <div style={{ background: 'var(--bg-paper)', minHeight: '100vh', paddingTop: 64 }}>
      <div
        className="mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: 'clamp(40px, 6vw, 64px) var(--content-pad-x) 32px',
        }}
      >
        <span className="t-eyebrow">Browse</span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.022em',
            margin: '8px 0 0',
            fontWeight: 400,
          }}
        >
          Open internships{pagination.total ? ` — ${pagination.total}` : ''}.
        </h1>
        <p
          className="t-body-lg"
          style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: 640 }}
        >
          Roles from verified Ethiopian companies. No account required to look
          around — you'll be asked to sign in when you're ready to apply.
        </p>

        {/* Search + filter row */}
        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-2 sm:grid-cols-[1.6fr_140px_180px_auto]"
          style={{
            padding: 12,
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Input
            icon={Search}
            placeholder="Search by title, skill or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            {(search || type || location) && (
              <Button type="button" variant="ghost" onClick={clearAll}>
                Clear
              </Button>
            )}
          </div>
        </form>

        {popularLocations.length > 1 && !location && !search && !type && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="t-caption"
              style={{ color: 'var(--text-tertiary)', marginRight: 4 }}
            >
              Popular:
            </span>
            {popularLocations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setLocation(loc);
                  load({ location: loc });
                }}
                className="rounded-full px-3 py-0.5 text-xs"
                style={{
                  background: 'var(--bg-raised)',
                  color: 'var(--text-secondary)',
                  boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
                }}
              >
                {loc}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <Card style={{ padding: 40, textAlign: 'center' }}>
              <p
                className="t-body-md"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No internships match your filters.
                {(search || type || location) && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={clearAll}
                      style={{
                        color: 'var(--brand-600)',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Clear filters →
                    </button>
                  </>
                )}
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <InternshipRow key={it._id} item={it} />
                ))}
              </div>

              {/* Pager — only when there's more than one page. */}
              {pagination.totalPages > 1 && (
                <Pager pagination={pagination} onChange={goTo} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pager ─────────────────────────────────────────────────────────────────
function Pager({ pagination, onChange }) {
  const { page, limit, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Window of page numbers around the current page. Keeps the pager compact
  // even with hundreds of pages: shows first, current ±2, last, with ellipses.
  const windowSize = 2;
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - windowSize && i <= page + windowSize)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <span
        className="t-caption"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          leading={<ChevronLeft size={14} strokeWidth={1.8} />}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </Button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`gap-${i}`}
              className="t-mono"
              style={{ color: 'var(--text-tertiary)', padding: '0 4px' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="t-mono"
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                background: p === page ? 'var(--brand-500)' : 'transparent',
                color: p === page ? '#fff' : 'var(--text-secondary)',
                border: 0,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          trailing={<ChevronRight size={14} strokeWidth={1.8} />}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function InternshipRow({ item }) {
  const pos = item.position || {};
  return (
    <Link to={`/internships/${item._id}`}>
      <Card
        style={{ padding: 18, cursor: 'pointer', transition: 'transform var(--dur-fast) var(--ease-emphasis), box-shadow var(--dur-fast) var(--ease-emphasis)' }}
        className="hover:-translate-y-px"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="t-display-sm truncate"
                style={{ margin: 0 }}
                title={item.title}
              >
                {item.title}
              </h2>
              {item.companyId?.verified && (
                <Badge tone="success" dot>
                  verified
                </Badge>
              )}
            </div>
            <p
              className="t-body-md truncate"
              style={{ color: 'var(--text-secondary)', marginTop: 2 }}
            >
              {item.companyId?.name || 'Company'}
              {item.companyId?.industry ? ` · ${item.companyId.industry}` : ''}
            </p>
            {item.description && (
              <p
                className="t-body-sm"
                style={{
                  color: 'var(--text-secondary)',
                  marginTop: 8,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.description}
              </p>
            )}
            <div
              className="mt-3 flex flex-wrap items-center"
              style={{ gap: 12, fontSize: 12, color: 'var(--text-tertiary)' }}
            >
              {item.locations?.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={1.8} />
                  {item.locations.join(', ')}
                </span>
              )}
              {pos.type && <span className="capitalize">{pos.type}</span>}
              {pos.duration && <span>{pos.duration}</span>}
              {pos.paid && <span>Paid</span>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            trailing={<ArrowRight size={14} strokeWidth={1.8} />}
          >
            View
          </Button>
        </div>
      </Card>
    </Link>
  );
}
