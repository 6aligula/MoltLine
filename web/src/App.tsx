import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { apiFetch } from './lib/api';
import { connectWs } from './lib/ws';
import { listUsers as listAuthUsers, login, register } from './lib/auth';

type Conversation = { convoId: string; kind: 'dm' | 'room'; members: string[] };

type Message = {
  messageId: string;
  convoId: string;
  from: string;
  text: string;
  ts: number;
};

function fmtTs(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function App() {
  const [token, setToken] = useState<string>('');
  const [me, setMe] = useState<{ userId: string; name?: string } | null>(null);
  const [authName, setAuthName] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<Array<{ userId: string; name: string }>>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const connectionIdRef = useRef(0);

  const activeConvo = useMemo(
    () => conversations.find(c => c.convoId === activeConvoId) || null,
    [conversations, activeConvoId],
  );

  async function refreshUsers() {
    if (!token) {
      setUsers([]);
      return;
    }
    const u = await listAuthUsers(token);
    setUsers(u);
  }

  async function refreshConversations() {
    const c = await apiFetch<Conversation[]>('/conversations', { token });
    setConversations(c);
    if (!activeConvoId && c[0]) setActiveConvoId(c[0].convoId);
  }

  async function refreshMe() {
    const out = await apiFetch<{ userId: string; name?: string }>('/me', { token });
    setMe(out);
  }

  async function refreshMessages(convoId: string) {
    const m = await apiFetch<Message[]>(`/conversations/${convoId}/messages`, { token });
    setMessages(m);
  }

  useEffect(() => {
    const saved = localStorage.getItem('moldline.jwt') || '';
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setMe(null);
      setConversations([]);
      setMessages([]);
      return;
    }
    setError(null);
    refreshMe().catch(e => setError(String(e.message || e)));
    refreshUsers().catch(e => setError(String(e.message || e)));
    refreshConversations().catch(e => setError(String(e.message || e)));

    const myId = ++connectionIdRef.current;
    const ws = connectWs({
      token,
      onOpen: () => {
        if (connectionIdRef.current !== myId) {
          ws.close();
          return;
        }
        setConnected(true);
      },
      onClose: () => {
        if (connectionIdRef.current !== myId) return;
        setConnected(false);
      },
      onMessage: (msg) => {
        if (connectionIdRef.current !== myId) return;
        if (msg.type === 'message') {
          const m = msg.data as Message;
          setMessages(prev => {
            if (activeConvoId && m.convoId !== activeConvoId) return prev;
            const without = prev.filter(x => x.messageId !== m.messageId);
            return [...without, m].sort((a, b) => a.ts - b.ts);
          });
        }
      },
    });
    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!activeConvoId || !token) return;
    refreshMessages(activeConvoId).catch(e => setError(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvoId, token]);

  async function createDM(otherUserId: string) {
    if (!token) return;
    setError(null);
    const out = await apiFetch<{ convoId: string }>('/dm', {
      method: 'POST',
      token,
      body: JSON.stringify({ otherUserId }),
    });
    await refreshConversations();
    setActiveConvoId(out.convoId);
  }

  async function send() {
    if (!activeConvoId || !token) return;
    const t = text.trim();
    if (!t) return;
    setText('');
    setError(null);
    const msg = await apiFetch<Message>(`/conversations/${activeConvoId}/messages`, {
      method: 'POST',
      token,
      body: JSON.stringify({ text: t }),
    });
    setMessages(prev => {
      const without = prev.filter(x => x.messageId !== msg.messageId);
      return [...without, msg].sort((a, b) => a.ts - b.ts);
    });
  }

  async function submitAuth(mode: 'login' | 'register') {
    if (!authName.trim() || !authPassword.trim()) return;
    setError(null);
    setAuthBusy(true);
    try {
      const out = mode === 'login'
        ? await login(authName.trim(), authPassword)
        : await register(authName.trim(), authPassword);
      setToken(out.token);
      localStorage.setItem('moldline.jwt', out.token);
      setAuthPassword('');
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    setToken('');
    setMe(null);
    setConnected(false);
    setUsers([]);
    setConversations([]);
    setMessages([]);
    setActiveConvoId(null);
    localStorage.removeItem('moldline.jwt');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h2>MoldLine chat (MVP)</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={authName}
          onChange={(e) => setAuthName(e.target.value)}
          placeholder="username"
        />
        <input
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          placeholder="password"
        />
        <button onClick={() => submitAuth('login').catch(e => setError(String(e.message || e)))} disabled={authBusy}>
          Login
        </button>
        <button onClick={() => submitAuth('register').catch(e => setError(String(e.message || e)))} disabled={authBusy}>
          Register
        </button>
        <button onClick={logout} disabled={!token}>
          Logout
        </button>
        <span style={{ opacity: 0.8 }}>
          {me ? `Session: ${me.userId}` : 'No session'}
        </span>
        <span style={{ opacity: 0.8 }}>WS: {connected ? 'connected' : 'disconnected'}</span>
        <button onClick={() => refreshConversations().catch(e => setError(String(e.message || e)))} disabled={!token}>
          Refresh convos
        </button>
        {error ? <span style={{ color: 'salmon' }}>{error}</span> : null}
      </div>

      <hr style={{ margin: '16px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div>
          <h3>Users</h3>
          <ul>
            {users.map(u => (
              <li key={u.userId}>
                {u.userId} — {u.name}{' '}
                {u.userId !== me?.userId ? (
                  <button onClick={() => createDM(u.userId)} style={{ marginLeft: 8 }}>
                    DM
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <h3>Conversations</h3>
          <ul>
            {conversations.map(c => (
              <li key={c.convoId}>
                <button
                  onClick={() => setActiveConvoId(c.convoId)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    fontWeight: c.convoId === activeConvoId ? 700 : 400,
                  }}
                >
                  {c.kind} — {c.convoId.slice(0, 6)}…
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Chat</h3>
          {activeConvo ? (
            <div style={{ opacity: 0.8, marginBottom: 8 }}>
              Active: {activeConvo.kind} / {activeConvo.convoId}
            </div>
          ) : (
            <div style={{ opacity: 0.8 }}>No conversation selected</div>
          )}

          <div
            style={{
              border: '1px solid #333',
              borderRadius: 8,
              padding: 12,
              height: 420,
              overflow: 'auto',
              background: '#0e0e0e',
            }}
          >
            {[...new Map(messages.map(m => [m.messageId, m])).values()]
              .sort((a, b) => a.ts - b.ts)
              .map(m => (
              <div key={m.messageId} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {m.from} · {fmtTs(m.ts)}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send().catch(err => setError(String(err.message || err)));
              }}
            />
            <button onClick={() => send().catch(err => setError(String(err.message || err)))} disabled={!activeConvoId}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
