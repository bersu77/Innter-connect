import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { placementApi } from '../../api/placements';
import { messageApi } from '../../api/messages';
import { Button, Card, Input, Spinner } from '../../components/ui';
import PageHeader from '../../components/PageHeader';

export default function MessagesPage() {
  const { user } = useAuth();
  const myId = String(user?.id || user?._id || '');
  const isStudent = (user?.userType ?? user?.role) === 'student';

  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  // On mobile the layout is single-pane: 'list' shows the threads, 'thread'
  // shows the active conversation. md+ shows both side-by-side always.
  const [mobileView, setMobileView] = useState('list');
  const endRef = useRef(null);

  useEffect(() => {
    placementApi
      .list()
      .then(({ placements }) => {
        const list = (placements || []).filter((p) => p.supervisorId);
        setThreads(list);
        // Auto-select the first thread for the side-by-side desktop layout;
        // on mobile the pane only opens after the user picks a thread.
        if (list.length) setActive(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openThread(p) {
    setActive(p);
    setMobileView('thread');
  }

  useEffect(() => {
    if (!active) return undefined;
    let on = true;
    const load = () =>
      messageApi
        .list(active._id)
        .then(({ messages: m }) => {
          if (on) setMessages(m || []);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 8000);
    return () => {
      on = false;
      clearInterval(timer);
    };
  }, [active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function counterpart(p) {
    if (isStudent) {
      const s = p.supervisorId;
      return s
        ? { name: `${s.firstName} ${s.lastName}`, username: s.username }
        : { name: 'Supervisor', username: '' };
    }
    const u = p.studentId?.userId;
    return u
      ? { name: `${u.firstName} ${u.lastName}`, username: u.username }
      : { name: 'Student', username: '' };
  }

  async function send(e) {
    e.preventDefault();
    if (!body.trim() || !active) return;
    setSending(true);
    try {
      const { message } = await messageApi.send(active._id, body.trim());
      setMessages((m) => [...m, message]);
      setBody('');
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  // Filter the conversation list by the other party's name or internship.
  const threadQuery = threadSearch.trim().toLowerCase();
  const visibleThreads = threadQuery
    ? threads.filter((p) =>
        `${counterpart(p).name} ${p.internshipId?.title || ''}`
          .toLowerCase()
          .includes(threadQuery),
      )
    : threads;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        eyebrow="Threads"
        title="Messages"
        lede={
          isStudent
            ? 'Chat with the supervisor assigned to your internship.'
            : 'Chat with the interns you supervise.'
        }
      />

      {threads.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No conversations yet. A thread opens once a supervisor is assigned to a placement.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className={`overflow-hidden md:col-span-1 ${
              mobileView === 'thread' ? 'hidden md:block' : ''
            }`}
          >
            <div className="border-b border-slate-100 p-2">
              <Input
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search conversations…"
              />
            </div>
            {visibleThreads.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                No conversations match.
              </p>
            )}
            {visibleThreads.map((p) => {
              const c = counterpart(p);
              const isActive = active?._id === p._id;
              return (
                <button
                  key={p._id}
                  onClick={() => openThread(p)}
                  aria-current={isActive ? 'true' : undefined}
                  className="relative flex w-full flex-col px-4 py-3 text-left transition-colors last:border-0"
                  style={{
                    background: isActive ? 'var(--brand-50)' : 'transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 2,
                        background: 'var(--brand-500)',
                        borderRadius: 999,
                      }}
                    />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color: isActive ? 'var(--brand-700)' : 'var(--text-primary)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: isActive
                        ? 'color-mix(in srgb, var(--brand-700) 80%, transparent)'
                        : 'var(--text-tertiary)',
                    }}
                  >
                    {p.internshipId?.title || 'Internship'}
                  </span>
                </button>
              );
            })}
          </Card>

          <Card
            className={`flex min-h-[28rem] flex-col md:col-span-2 ${
              mobileView === 'list' ? 'hidden md:flex' : ''
            }`}
          >
            {active &&
              (() => {
                const c = counterpart(active);
                return (
                  <>
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setMobileView('list')}
                        className="btn btn-ghost btn-sm md:hidden shrink-0"
                        style={{ width: 32, height: 32, padding: 0, marginLeft: -4 }}
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft size={16} strokeWidth={1.8} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-800 truncate">{c.name}</div>
                        {c.username && (
                          <div className="text-xs text-slate-400 truncate">@{c.username}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {messages.length === 0 && (
                        <p className="py-10 text-center text-sm text-slate-400">
                          No messages yet — say hello.
                        </p>
                      )}
                      {messages.map((m) => {
                        const mine = String(m.senderId?._id || m.senderId) === myId;
                        return (
                          <div key={m._id} className={mine ? 'text-right' : 'text-left'}>
                            <div
                              className={`inline-block max-w-[80%] rounded-2xl px-3.5 py-2 text-left text-sm ${
                                mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.body}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-400">
                              {m.senderId?.firstName || 'You'} ·{' '}
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={endRef} />
                    </div>
                    <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
                      <Input
                        className="flex-1"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type a message…"
                      />
                      <Button type="submit" loading={sending}>
                        Send
                      </Button>
                    </form>
                  </>
                );
              })()}
          </Card>
        </div>
      )}
    </div>
  );
}
