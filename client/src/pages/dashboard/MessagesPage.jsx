import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placementApi } from '../../api/placements';
import { messageApi } from '../../api/messages';
import { Button, Card, Input, Spinner } from '../../components/ui';

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
  const endRef = useRef(null);

  useEffect(() => {
    placementApi
      .list()
      .then(({ placements }) => {
        // A thread needs both a student and a supervisor.
        const list = (placements || []).filter((p) => p.supervisorId);
        setThreads(list);
        if (list.length) setActive(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudent
            ? 'Chat with the supervisor assigned to your internship.'
            : 'Chat with the interns you supervise.'}
        </p>
      </div>

      {threads.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No conversations yet. A thread opens once a supervisor is assigned to a placement.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden md:col-span-1">
            {threads.map((p) => {
              const c = counterpart(p);
              return (
                <button
                  key={p._id}
                  onClick={() => setActive(p)}
                  className={`flex w-full flex-col border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 ${
                    active?._id === p._id ? 'bg-brand-50' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-slate-800">{c.name}</span>
                  <span className="text-xs text-slate-400">{p.internshipId?.title || 'Internship'}</span>
                </button>
              );
            })}
          </Card>

          <Card className="flex min-h-[28rem] flex-col md:col-span-2">
            {active &&
              (() => {
                const c = counterpart(active);
                return (
                  <>
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                      {c.username && <div className="text-xs text-slate-400">@{c.username}</div>}
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
