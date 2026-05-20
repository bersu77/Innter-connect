import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api/notifications';

// Notification Center (UC019) — bell with unread badge + dropdown panel.
//
// Bug-fix bundle:
//   • Portal-render the dropdown into <body> with position:fixed so it can't
//     be clipped by — or stacked below — any ancestor's stacking context.
//     The header uses backdrop-blur, which creates a stacking context; the
//     dropdown extending below it was rendering UNDER cards on pages like
//     Reports and Company Profile.
//   • Single-click mark-read is now optimistic: the unread count drops
//     instantly instead of waiting for the server round-trip + reload.
//   • An IntersectionObserver auto-marks unread items as read once they've
//     been visible inside the open dropdown for ~600ms — the count
//     decreases as the user *views* notifications, not only via Mark all.
//   • Background polling pauses while the dropdown is open so a stale
//     `load()` can't overwrite the optimistic state mid-interaction.

const PANEL_W = 320;          // px (matches old w-80)
const PANEL_OFFSET = 8;       // px below the bell
const VIEW_DWELL_MS = 600;    // how long an unread item must be visible

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [panelPos, setPanelPos] = useState(null);
  const inFlightRef = useRef(new Set());
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications || []);
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

  // Outside-click / ESC close.
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

  // Position the portal panel against the bell.
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

  // Optimistic mark-read.
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
      await load();
    } finally {
      inFlightRef.current.delete(id);
    }
  }, [load]);

  async function markAll() {
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

  // Auto-mark on view (IntersectionObserver inside the panel).
  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const root = panelRef.current.querySelector('[data-role="list"]');
    if (!root) return undefined;

    const timers = new Map();
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

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && panelPos && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="overflow-hidden rounded-2xl bg-white shadow-soft-lg ring-1 ring-slate-200/70"
          style={{
            position: 'fixed',
            top: panelPos.top,
            right: panelPos.right,
            width: PANEL_W,
            maxWidth: 'calc(100vw - 16px)',
            zIndex: 1000,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">
              Notifications
              {unread > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div data-role="list" className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  data-id={n._id}
                  data-unread={!n.read}
                  onClick={() => onItemClick(n)}
                  className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 ${
                    !n.read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-slate-800">{n.title}</span>
                  <span className="text-xs text-slate-500">{n.message}</span>
                  <span className="text-[11px] text-slate-400">
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
