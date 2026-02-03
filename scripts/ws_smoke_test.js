// Smoke test: connect two WS clients (a,b), create room, join, send message, expect b receives it.
const { WebSocket } = require('ws');

const API = 'http://127.0.0.1:8787';

async function http(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { ...headers, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(`${res.status}: ${txt}`);
  return data;
}

function waitForMessage(ws, predicate, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout waiting ws msg')), timeoutMs);
    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (predicate(msg)) {
          clearTimeout(t);
          resolve(msg);
        }
      } catch {}
    });
  });
}

(async () => {
  const wsA = new WebSocket('ws://127.0.0.1:8787?userId=a');
  const wsB = new WebSocket('ws://127.0.0.1:8787?userId=b');

  await Promise.all([
    new Promise((r) => wsA.once('open', r)),
    new Promise((r) => wsB.once('open', r)),
  ]);

  const room = await http('/rooms', { method: 'POST', headers: { 'x-user-id': 'a' }, body: { name: 'ws-smoke' } });
  await http(`/rooms/${room.roomId}/join`, { method: 'POST', headers: { 'x-user-id': 'b' }, body: {} });

  const recv = waitForMessage(wsB, (m) => m.type === 'message' && m.data?.convoId === room.roomId && m.data?.text === 'ping');
  await http(`/conversations/${room.roomId}/messages`, { method: 'POST', headers: { 'x-user-id': 'a' }, body: { text: 'ping' } });

  const got = await recv;
  console.log('WS_OK', got.data);

  wsA.close();
  wsB.close();
})().catch((e) => {
  console.error('WS_FAIL', e);
  process.exit(1);
});
