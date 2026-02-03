const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { nanoid } = require('nanoid');

const PORT = process.env.PORT || 8787;

// In-memory store (MVP0)
const users = new Map(); // userId -> { userId, name }
// conversations includes DMs and rooms
// convoId -> { convoId, kind:'dm'|'room', members:[userId], messages:[...], ... }
const conversations = new Map();

function ensureUser(userId) {
  const u = users.get(userId);
  if (!u) throw Object.assign(new Error('unknown user'), { status: 400 });
  return u;
}

function getOrCreateDM(a, b) {
  // deterministic key
  const key = [a, b].sort().join(':');
  for (const c of conversations.values()) {
    if (c.kind === 'dm' && c.key === key) return c;
  }
  const convoId = nanoid();
  const convo = { convoId, kind: 'dm', key, members: [a, b], messages: [] };
  conversations.set(convoId, convo);
  return convo;
}

function createRoom({ name, createdBy }) {
  if (!name || typeof name !== 'string') {
    throw Object.assign(new Error('missing name'), { status: 400 });
  }
  const trimmed = name.trim();
  if (!trimmed) throw Object.assign(new Error('missing name'), { status: 400 });
  if (trimmed.length > 80) throw Object.assign(new Error('name too long'), { status: 400 });

  const convoId = nanoid();
  const room = {
    convoId,
    kind: 'room',
    name: trimmed,
    createdBy,
    createdAt: Date.now(),
    members: [createdBy],
    messages: [],
  };
  conversations.set(convoId, room);
  return room;
}

function ensureRoom(convoId) {
  const c = conversations.get(convoId);
  if (!c || c.kind !== 'room') throw Object.assign(new Error('room not found'), { status: 404 });
  return c;
}

// Seed two dev users
users.set('a', { userId: 'a', name: 'User A' });
users.set('b', { userId: 'b', name: 'User B' });

const app = express();
app.use(express.json());

// Simple auth middleware via header
app.use((req, _res, next) => {
  const userId = req.header('x-user-id');
  if (userId) req.userId = userId;
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/me', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  const u = ensureUser(userId);
  res.json(u);
});

app.get('/users', (_req, res) => {
  res.json(Array.from(users.values()));
});

app.post('/dm', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);
  const { otherUserId } = req.body || {};
  if (!otherUserId) return res.status(400).json({ error: 'missing otherUserId' });
  ensureUser(otherUserId);
  const convo = getOrCreateDM(userId, otherUserId);
  res.json({ convoId: convo.convoId });
});

// Rooms (very small MVP)
app.post('/rooms', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);

  const { name } = req.body || {};
  try {
    const room = createRoom({ name, createdBy: userId });
    res.json({ roomId: room.convoId, name: room.name });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'error' });
  }
});

// idempotent join (open room model)
app.post('/rooms/:roomId/join', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);

  try {
    const room = ensureRoom(req.params.roomId);
    if (!room.members.includes(userId)) room.members.push(userId);
    res.json({ roomId: room.convoId, name: room.name, members: room.members });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'error' });
  }
});

app.get('/rooms', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);

  const rooms = Array.from(conversations.values())
    .filter(c => c.kind === 'room')
    .map(r => ({ roomId: r.convoId, name: r.name, memberCount: r.members.length }));
  res.json(rooms);
});

app.get('/conversations', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);
  const list = Array.from(conversations.values())
    .filter(c => c.members.includes(userId))
    .map(c => ({ convoId: c.convoId, kind: c.kind, members: c.members }));
  res.json(list);
});

app.get('/conversations/:convoId/messages', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);
  const convo = conversations.get(req.params.convoId);
  if (!convo || !convo.members.includes(userId)) return res.status(404).json({ error: 'not found' });
  res.json(convo.messages);
});

app.post('/conversations/:convoId/messages', (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'missing x-user-id' });
  ensureUser(userId);

  const convo = conversations.get(req.params.convoId);
  if (!convo || !convo.members.includes(userId)) return res.status(404).json({ error: 'not found' });

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'missing text' });

  const msg = {
    messageId: nanoid(),
    convoId: convo.convoId,
    from: userId,
    text,
    ts: Date.now(),
  };
  convo.messages.push(msg);

  // fanout over WS
  broadcastToConvo(convo.convoId, msg);

  res.json(msg);
});

const server = http.createServer(app);

// WS layer
const wss = new WebSocketServer({ server });
const socketsByUser = new Map(); // userId -> Set(ws)

function trackSocket(userId, ws) {
  if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
  socketsByUser.get(userId).add(ws);
  ws.on('close', () => {
    socketsByUser.get(userId)?.delete(ws);
  });
}

function broadcastToConvo(convoId, msg) {
  const convo = conversations.get(convoId);
  if (!convo) return;
  const payload = JSON.stringify({ type: 'message', data: msg });
  for (const member of convo.members) {
    const set = socketsByUser.get(member);
    if (!set) continue;
    for (const ws of set) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  if (!userId || !users.has(userId)) {
    ws.close(1008, 'missing/invalid userId');
    return;
  }
  trackSocket(userId, ws);
  ws.send(JSON.stringify({ type: 'hello', data: { userId } }));
});

server.listen(PORT, () => {
  console.log(`MoldLine server listening on http://localhost:${PORT}`);
  console.log('Dev users: a, b');
});
