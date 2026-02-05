import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { AppError } from '../../application/errors';
import type { ReturnTypeMakeUseCases } from '../../bootstrap/types';
import type { InProcessWsGateway } from '../realtime/wsGateway';

export function buildServer(deps: {
  usecases: ReturnTypeMakeUseCases;
  realtime: InProcessWsGateway;
}) {
  const app = express();

  // CORS (allow chat.moldline.space to call api.moldline.space)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = new Set([
      'https://chat.moldline.space',
      // local dev (optional)
      'http://localhost:5173',
    ]);

    if (origin && allowed.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,x-user-id');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());

  // Simple auth middleware via header
  app.use((req, _res, next) => {
    const userId = req.header('x-user-id');
    if (userId) (req as any).userId = userId;
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/me', async (req, res, next) => {
    try {
      const u = await deps.usecases.getMe({ userId: (req as any).userId });
      res.json(u);
    } catch (e) {
      next(e);
    }
  });

  app.get('/users', async (_req, res, next) => {
    try {
      res.json(await deps.usecases.listUsers());
    } catch (e) {
      next(e);
    }
  });

  app.post('/dm', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      const { otherUserId } = req.body || {};
      const out = await deps.usecases.createDM({ userId, otherUserId });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.post('/rooms', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      const { name } = req.body || {};
      const out = await deps.usecases.createRoom({ userId, name });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.post('/rooms/:roomId/join', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      const out = await deps.usecases.joinRoom({ userId, roomId: req.params.roomId });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.get('/rooms', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      res.json(await deps.usecases.listRooms({ userId }));
    } catch (e) {
      next(e);
    }
  });

  app.get('/conversations', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      res.json(await deps.usecases.listConversations({ userId }));
    } catch (e) {
      next(e);
    }
  });

  app.get('/conversations/:convoId/messages', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      res.json(await deps.usecases.listMessages({ userId, convoId: req.params.convoId }));
    } catch (e) {
      next(e);
    }
  });

  app.post('/conversations/:convoId/messages', async (req, res, next) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) throw new AppError('missing x-user-id', 401);
      const { text } = req.body || {};
      res.json(await deps.usecases.sendMessage({ userId, convoId: req.params.convoId, text }));
    } catch (e) {
      next(e);
    }
  });

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err?.status ?? (err instanceof AppError ? err.status : 500);
    const message = err?.message ?? 'error';
    res.status(status).json({ error: message });
  });

  const server = http.createServer(app);

  // WS layer
  // Serve websocket under a stable path for clients: /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      ws.close(1008, 'missing userId');
      return;
    }

    deps.realtime.registerUserSocket(userId, ws as any);
    ws.send(JSON.stringify({ type: 'hello', data: { userId } }));
  });

  return { app, server };
}
