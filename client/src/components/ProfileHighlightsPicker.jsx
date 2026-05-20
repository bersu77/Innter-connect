// ProfileHighlightsPicker — Upwork-style application-attachment picker.
//
// Each artifact KIND (CV, Certification, Experience, Portfolio) gets ONE
// "Add a …" tile, but only when the student actually has items of that kind
// in their profile — kinds with no items don't render a tile (no empty
// states, no broken "Add" buttons that go nowhere).
//
// Clicking a tile opens a modal listing the student's existing items of that
// kind. They pick one or more, hit "Add to highlights", and the items appear
// as draggable-style rows below the tiles. Total cap: MAX_HIGHLIGHTS (4).
//
// Server contract is unchanged: `selected` is an array of `{ kind, index }`,
// snapshotted server-side onto Application.attachments. The full item
// metadata (title, detail) is carried client-side for rendering only.

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Briefcase,
  FileText,
  FolderOpen,
  X,
  Check,
  Plus,
} from 'lucide-react';
import Button from './ui/Button';

const MAX_HIGHLIGHTS = 4;

const KIND_META = {
  cv: {
    label: 'CV',
    plural: 'CV',
    addLabel: 'Add your CV',
    icon: FileText,
  },
  certification: {
    label: 'Certification',
    plural: 'Certifications',
    addLabel: 'Add a certification',
    icon: Award,
  },
  experience: {
    label: 'Work experience',
    plural: 'Work experience',
    addLabel: 'Add an experience',
    icon: Briefcase,
  },
  portfolio: {
    label: 'Portfolio project',
    plural: 'Portfolio',
    addLabel: 'Add a portfolio project',
    icon: FolderOpen,
  },
};
const ORDER = ['cv', 'certification', 'experience', 'portfolio'];

// Map the student's profile into a per-kind item list used by the picker.
function getItems(profile) {
  const out = { cv: [], certification: [], experience: [], portfolio: [] };
  if (profile?.cv?.path) {
    out.cv.push({
      kind: 'cv',
      index: 0,
      key: 'cv:0',
      title: profile.cv.filename || 'Résumé',
      detail: null,
    });
  }
  (profile?.certifications || []).forEach((c, i) => {
    out.certification.push({
      kind: 'certification',
      index: i,
      key: `certification:${i}`,
      title: c.name || 'Certification',
      detail: c.issuer || null,
    });
  });
  (profile?.experience || []).forEach((e, i) => {
    const date = [e.startDate, e.endDate].filter(Boolean).join(' – ');
    out.experience.push({
      kind: 'experience',
      index: i,
      key: `experience:${i}`,
      title: e.role || 'Experience',
      detail: [e.organization, date].filter(Boolean).join(' · ') || null,
    });
  });
  (profile?.portfolio || []).forEach((p, i) => {
    out.portfolio.push({
      kind: 'portfolio',
      index: i,
      key: `portfolio:${i}`,
      title: p.title || 'Portfolio item',
      detail: p.link || p.filename || null,
    });
  });
  return out;
}

// ── Tile: "Add a [kind]" ─────────────────────────────────────────────────
function AddTile({ kind, meta, disabled, onClick }) {
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center justify-center gap-2 rounded-lg transition-colors"
      style={{
        padding: '24px 16px',
        minHeight: 112,
        background: 'transparent',
        border: '1px dashed var(--border-strong)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--bg-subtle)';
          e.currentTarget.style.borderColor = 'var(--brand-500)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'var(--brand-50)',
          color: 'var(--brand-700)',
        }}
      >
        <Icon size={18} strokeWidth={1.6} />
      </span>
      <span className="t-body-sm" style={{ fontWeight: 500 }}>
        {meta.addLabel}
      </span>
    </button>
  );
}

// ── Selected row ─────────────────────────────────────────────────────────
function SelectedRow({ item, index, onRemove }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <div
      className="flex items-center gap-3 rounded-md px-3 py-3"
      style={{
        background: 'var(--bg-subtle)',
        boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      }}
    >
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--brand-100)',
          color: 'var(--brand-700)',
        }}
      >
        <Icon size={16} strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="t-eyebrow"
          style={{ marginBottom: 2 }}
        >
          {meta.label}
        </div>
        <div
          className="t-body-md truncate"
          style={{ fontWeight: 500, color: 'var(--text-primary)' }}
        >
          {index + 1}. {item.title}
        </div>
        {item.detail && (
          <div
            className="t-body-sm truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {item.detail}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.key)}
        aria-label={`Remove ${item.title}`}
        className="btn btn-ghost btn-sm shrink-0"
        style={{ width: 32, height: 32, padding: 0 }}
      >
        <X size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────
function PickerModal({ kind, items, selected, max, onAdd, onClose }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const selectedKeys = new Set(selected.map((s) => s.key));
  const remaining = max - selected.length;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add a ${meta.label.toLowerCase()}`}
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:p-6"
      style={{
        background: 'color-mix(in srgb, var(--stone-900) 50%, transparent)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden"
        style={{
          background: 'var(--bg-raised)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-4), 0 0 0 1px var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="min-w-0">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                fontWeight: 400,
                margin: 0,
              }}
            >
              Add a {meta.label.toLowerCase()}
            </h3>
            <p
              className="t-body-sm"
              style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}
            >
              Pick up to {max} highlights total to attach to this application.
              <span style={{ marginLeft: 8 }}>
                <strong>{selected.length}/{max}</strong> selected.
              </span>
            </p>
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

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const isSelected = selectedKeys.has(item.key);
              const disabled = !isSelected && remaining <= 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-md p-3"
                  style={{
                    background: isSelected
                      ? 'color-mix(in srgb, var(--brand-50) 70%, transparent)'
                      : 'var(--bg-paper)',
                    boxShadow: isSelected
                      ? '0 0 0 1px var(--brand-500)'
                      : 'inset 0 0 0 1px var(--border-subtle)',
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-flex shrink-0 items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--brand-100)',
                      color: 'var(--brand-700)',
                    }}
                  >
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="t-body-md truncate"
                      style={{ fontWeight: 500, color: 'var(--text-primary)' }}
                    >
                      {item.title}
                    </div>
                    {item.detail && (
                      <div
                        className="t-body-sm truncate"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.detail}
                      </div>
                    )}
                  </div>
                  {isSelected ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      leading={<Check size={14} strokeWidth={2} />}
                      disabled
                      className="shrink-0"
                    >
                      Selected
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      leading={<Plus size={14} strokeWidth={2} />}
                      disabled={disabled}
                      onClick={() => onAdd(item)}
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {remaining <= 0 && (
            <p
              className="t-caption"
              style={{ marginTop: 12, color: 'var(--text-tertiary)' }}
            >
              You've reached the {max}-highlight limit. Remove one from the application to add another.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-5 py-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function ProfileHighlightsPicker({
  profile,
  selected,
  onChange,
  max = MAX_HIGHLIGHTS,
}) {
  const itemsByKind = useMemo(() => getItems(profile), [profile]);
  const [modalKind, setModalKind] = useState(null);

  // Only show tiles for kinds the student actually HAS items in.
  const availableKinds = ORDER.filter((k) => itemsByKind[k].length > 0);

  // Nothing to highlight — hide the whole section. The "Or upload files"
  // path below the picker still lets the student attach files manually.
  if (availableKinds.length === 0) return null;

  const remaining = max - selected.length;
  const atLimit = remaining <= 0;

  function add(item) {
    if (selected.find((s) => s.key === item.key)) return;
    if (selected.length >= max) return;
    onChange([...selected, item]);
  }

  function remove(key) {
    onChange(selected.filter((s) => s.key !== key));
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p
          className="t-heading-sm"
          style={{ color: 'var(--text-primary)', margin: 0 }}
        >
          Profile highlights
        </p>
        <span
          className="t-mono"
          style={{
            fontSize: 10.5,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {selected.length}/{max}
        </span>
      </div>
      <p
        className="t-body-sm"
        style={{
          color: 'var(--text-secondary)',
          marginTop: 4,
          marginBottom: 12,
        }}
      >
        Pick up to {max} items from your profile to attach to this application.
        Only items you've already saved to your profile appear here.
      </p>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        {availableKinds.map((kind) => {
          const meta = KIND_META[kind];
          // For singular kinds (CV), disable the tile once the only item is selected.
          const total = itemsByKind[kind].length;
          const usedFromKind = selected.filter((s) => s.kind === kind).length;
          const exhausted = usedFromKind >= total;
          return (
            <AddTile
              key={kind}
              kind={kind}
              meta={meta}
              disabled={atLimit || exhausted}
              onClick={() => setModalKind(kind)}
            />
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {selected.map((item, i) => (
            <SelectedRow
              key={item.key}
              item={item}
              index={i}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {modalKind && (
        <PickerModal
          kind={modalKind}
          items={itemsByKind[modalKind]}
          selected={selected}
          max={max}
          onAdd={add}
          onClose={() => setModalKind(null)}
        />
      )}
    </div>
  );
}
