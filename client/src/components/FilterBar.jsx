// FilterBar — v2. A search input + dropdown filter selects on one row.
// On desktop sits in a recessed bar (bg-subtle). Wraps to two rows on tablet.
import { Input, Select } from './ui';

const humanize = (s) => String(s ?? '').replace(/_/g, ' ');

export default function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  values = {},
  onChange,
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg p-3"
      style={{ background: 'var(--bg-subtle)' }}
    >
      {onSearch && (
        <Input
          className="min-w-[12rem] flex-1"
          value={search ?? ''}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
        />
      )}
      {filters
        .filter((f) => f.options.length > 0)
        .map((f) => (
          <Select
            key={f.key}
            className="w-44"
            value={values[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
          >
            <option value="">All {f.label.toLowerCase()}</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </Select>
        ))}
    </div>
  );
}
