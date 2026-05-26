import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api/notifications';

// Notification Center (UC019).
//
// Bug-fix bundle:
//   • The dropdown is portal-rendered to <body> with position:fixed so it
//     can't be clipped by — or stacked below — any ancestor's
//     stacking context (the header's `backdrop-filter` was creating one,
//     which is why the panel appeared underneath cards on Reports / Company
//     Profile).
//   • Single-click mark-read is now optimistic: the unread count drops
//     instantly instead of waiting for the server round-trip + reload.
//   • An IntersectionObserver auto-marks unread items as read once they've
//     been visible inside the open dropdown for ~600ms, so the count
//     decreases as the user *views* notifications instead of only when they
//     hit "Mark all read".
//   • Background polling is paused while the dropdown is open so a stale
//     `load()` can't overwrite the optimistic state mid-interaction.

const PANEL_W = 360;          // px
const PANEL_OFFSET = 8;       // px below the bell
const VIEW_DWELL_MS = 600;    // how long an unread item must be visible

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [panelPos, setPanelPos] = useState(null);
  const inFlightRef = useRef(new Set());     // ids being marked-read
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  // ── Loading ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications || []);
      // Don't clobber optimistic state: if any markRead is mid-flight,
      // trust the local unread we already maintain.
      if (inFlightRef.current.size === 0) {
        setUnread(data.unread || 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll, but pause while the dropdown is open (the user is actively viewing).
  useEffect(() => {
    if (open) return undefined;
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [open, load]);

  // ── Outside-click ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return undefined;
    function onMouse(e) {
      const t = e.target;
      if (bellRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ── Position the portal panel against the bell ───────────────────────────
  const computePos = useCallback(() => {
    const b = bellRef.current?.getBoundingClientRect();
    if (!b) return;
    const right = Math.max(8, window.innerWidth - b.right);
    const top = b.bottom + PANEL_OFFSET;
    setPanelPos({ top, right });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    computePos();
    const onResize = () => computePos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, computePos]);

  // ── Optimistic mark-read ─────────────────────────────────────────────────
  const markReadOptimistic = useCallback(async (id) => {
    if (inFlightRef.current.has(id)) return;
    inFlightRef.current.add(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id && !n.read
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n,
      ),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      // Roll back via a fresh server reload.
      await load();
    } finally {
      inFlightRef.current.delete(id);
    }
  }, [load]);

  async function markAll() {
    // Optimistic — show zero immediately, then sync.
    setNotifications((prev) =>
      prev.map((n) =>
        n.read ? n : { ...n, read: true, readAt: new Date().toISOString() },
      ),
    );
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      await load();
    }
  }

  function onItemClick(n) {
    if (!n.read) markReadOptimistic(n._id);
  }

  // ── Auto-mark on view (IntersectionObserver inside the panel) ────────────
  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const root = panelRef.current.querySelector('[data-role="list"]');
    if (!root) return undefined;

    const timers = new Map(); // id → setTimeout handle
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-id');
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (!timers.has(id)) {
              const t = setTimeout(() => {
                markReadOptimistic(id);
                timers.delete(id);
              }, VIEW_DWELL_MS);
              timers.set(id, t);
            }
          } else if (timers.has(id)) {
            clearTimeout(timers.get(id));
            timers.delete(id);
          }
        }
      },
      { root, threshold: [0, 0.6, 1] },
    );

    root
      .querySelectorAll('[data-id][data-unread="true"]')
      .forEach((el) => obs.observe(el));

    return () => {
      timers.forEach((t) => clearTimeout(t));
      obs.disconnect();
    };
  }, [open, notifications, markReadOptimistic]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm"
        style={{ width: 36, height: 36, padding: 0, position: 'relative' }}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} strokeWidth={1.6} />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute"
            style={{
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: 'var(--amber-500)',
              boxShadow: '0 0 0 2px var(--bg-raised)',
            }}
          />
        )}
      </button>

      {open && panelPos && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="overflow-hidden"
          style={{
            position: 'fixed',
            top: panelPos.top,
            right: panelPos.right,
            width: PANEL_W,
            maxWidth: 'calc(100vw - 16px)',
            zIndex: 1000,
            background: 'var(--bg-raised)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-4), 0 0 0 1px var(--border-default)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="t-heading-sm" style={{ color: 'var(--text-primary)' }}>
              Notifications
              {unread > 0 && (
                <span
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    marginLeft: 8,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: 'var(--brand-500)',
                    color: '#fff',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="t-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--brand-600)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div data-role="list" className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p
                className="px-4 py-8 text-center t-body-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No notifications
              </p>
            ) : (
              notifications.map((n, i) => (
                <button
                  key={n._id}
                  data-id={n._id}
                  data-unread={!n.read}
                  onClick={() => onItemClick(n)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors"
                  style={{
                    borderTop: i ? '1px solid var(--border-subtle)' : undefined,
                    background: !n.read
                      ? 'color-mix(in srgb, var(--brand-50) 60%, transparent)'
                      : 'transparent',
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="t-body-md"
                    style={{ fontWeight: 500, color: 'var(--text-primary)' }}
                  >
                    {n.title}
                  </span>
                  <span className="t-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    {n.message}
                  </span>
                  <span className="t-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
