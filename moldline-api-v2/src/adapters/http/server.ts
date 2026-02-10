import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { AppError } from '../../application/errors';
import type { ReturnTypeMakeUseCases } from '../../bootstrap/types';
import type { InProcessWsGateway } from '../realtime/wsGateway';
import * as jwt from 'jsonwebtoken';
import { authMiddleware } from './authMiddleware';

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
    res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());
  app.use(authMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/me', async (req, res, next) => {
    try {
      const u = await deps.usecases.getMe({ userId: req.userId, userName: req.userName });
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
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      const { otherUserId } = req.body || {};
      const out = await deps.usecases.createDM({ userId, otherUserId, userName: req.userName });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.post('/rooms', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      const { name } = req.body || {};
      const out = await deps.usecases.createRoom({ userId, name, userName: req.userName });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.post('/rooms/:roomId/join', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      const out = await deps.usecases.joinRoom({ userId, roomId: req.params.roomId, userName: req.userName });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.get('/rooms', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      res.json(await deps.usecases.listRooms({ userId, userName: req.userName }));
    } catch (e) {
      next(e);
    }
  });

  app.get('/conversations', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      res.json(await deps.usecases.listConversations({ userId, userName: req.userName }));
    } catch (e) {
      next(e);
    }
  });

  app.get('/conversations/:convoId/messages', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      res.json(await deps.usecases.listMessages({ userId, convoId: req.params.convoId, userName: req.userName }));
    } catch (e) {
      next(e);
    }
  });

  app.post('/conversations/:convoId/messages', async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) throw new AppError('missing Authorization Bearer token', 401);
      const { text } = req.body || {};
      res.json(await deps.usecases.sendMessage({ userId, convoId: req.params.convoId, text, userName: req.userName }));
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
    const token = url.searchParams.get('token');
    let userId: string | null = null;
    if (token && process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { sub: string };
        userId = decoded.sub;
      } catch {
        // token inválido
      }
    }
    if (!userId) {
      ws.close(1008, 'missing valid token');
      return;
    }
    deps.realtime.registerUserSocket(userId, ws as any);
    ws.send(JSON.stringify({ type: 'hello', data: { userId } }));
  });

  return { app, server };
}
