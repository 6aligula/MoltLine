import { z } from 'zod';
import type { ConversationsRepository, UsersRepository } from '../ports/repositories';
import type { RealtimeGateway } from '../ports/realtime';
import type { Message } from '../domain/entities';
import type { ConversationId, UserId } from '../domain/types';
import { badRequest, notFound, unauthorized } from './errors';

export function makeUseCases(deps: {
  usersRepo: UsersRepository;
  convosRepo: ConversationsRepository;
  realtime: RealtimeGateway;
  id: () => string;
  now: () => number;
}) {
  /** Lazy registration: crea el usuario en el store si no existe (Auth API es fuente de verdad). */
  async function ensureUser(userId: UserId, name?: string) {
    return deps.usersRepo.ensureExists(userId, name);
  }

  async function createDM(params: { userId: UserId; otherUserId: UserId; userName?: string }) {
    if (!params.otherUserId || typeof params.otherUserId !== 'string') throw badRequest('otherUserId required');
    await ensureUser(params.userId, params.userName);
    await ensureUser(params.otherUserId);
    const convo = await deps.convosRepo.getOrCreateDM(params.userId, params.otherUserId);
    // Misma forma que cada item de GET /conversations para decodificar igual en el cliente
    return { convoId: convo.convoId, kind: convo.kind, members: convo.members };
  }

  async function createRoom(params: { userId: UserId; name: string; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const name = z.string().trim().min(1).max(80).parse(params.name);
    const room = await deps.convosRepo.createRoom({ name, createdBy: params.userId });
    return { roomId: room.convoId, name: room.name };
  }

  async function joinRoom(params: { userId: UserId; roomId: ConversationId; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const room = await deps.convosRepo.addMember(params.roomId, params.userId);
    if (room.kind !== 'room') throw notFound('room not found');
    return { roomId: room.convoId, name: room.name, members: room.members };
  }

  async function listRooms(params: { userId: UserId; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const rooms = (await deps.convosRepo.listForUser(params.userId))
      .filter(c => c.kind === 'room')
      .map(r => ({ roomId: r.convoId, name: r.name, memberCount: r.members.length }));
    return rooms;
  }

  async function listConversations(params: { userId: UserId; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const list = (await deps.convosRepo.listForUser(params.userId)).map(c => ({
      convoId: c.convoId,
      kind: c.kind,
      members: c.members,
    }));
    return list;
  }

  async function listMessages(params: { userId: UserId; convoId: ConversationId; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const convo = await deps.convosRepo.get(params.convoId);
    if (!convo || !convo.members.includes(params.userId)) throw notFound('not found');
    return convo.messages;
  }

  async function sendMessage(params: { userId: UserId; convoId: ConversationId; text: string; userName?: string }) {
    await ensureUser(params.userId, params.userName);
    const convo = await deps.convosRepo.get(params.convoId);
    if (!convo || !convo.members.includes(params.userId)) throw notFound('not found');

    const text = z.string().min(1).max(10_000).parse(params.text);

    const msg: Message = {
      messageId: deps.id(),
      convoId: convo.convoId,
      from: params.userId,
      text,
      ts: deps.now(),
    };

    await deps.convosRepo.appendMessage(convo.convoId, msg);

    deps.realtime.broadcastMessage(convo.convoId, msg, convo.members);

    return msg;
  }

  async function getMe(params: { userId?: UserId; userName?: string }) {
    if (!params.userId) throw unauthorized('missing Authorization Bearer token');
    const u = await ensureUser(params.userId, params.userName);
    return u;
  }

  async function listUsers() {
    return deps.usersRepo.list();
  }

  return {
    getMe,
    listUsers,
    createDM,
    createRoom,
    joinRoom,
    listRooms,
    listConversations,
    listMessages,
    sendMessage,
  };
}
