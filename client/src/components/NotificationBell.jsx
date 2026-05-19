import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api/notifications';

// Notification Center (UC019) — v2 bell with amber unread dot + raised panel.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  async function load() {
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAll() {
    await notificationApi.markAllRead();
    load();
  }

  async function openOne(n) {
    if (!n.read) {
      await notificationApi.markRead(n._id);
      load();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm"
        style={{ width: 36, height: 36, padding: 0, position: 'relative' }}
        aria-label="Notifications"
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

      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-80 overflow-hidden"
          style={{
            background: 'var(--bg-raised)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-3), 0 0 0 1px var(--border-default)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="t-heading-sm" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="t-mono"
                style={{ fontSize: 11, color: 'var(--brand-600)' }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
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
                  onClick={() => openOne(n)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors"
                  style={{
                    borderTop: i ? '1px solid var(--border-subtle)' : undefined,
                    background: !n.read
                      ? 'color-mix(in srgb, var(--brand-50) 60%, transparent)'
                      : 'transparent',
                  }}
                >
                  <span className="t-body-md" style={{ fontWeight: 500 }}>
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
        </div>
      )}
    </div>
  );
}
