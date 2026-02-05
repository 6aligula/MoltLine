import type { Conversation, Message, User } from '../../domain/entities';
import type { ConversationId, UserId } from '../../domain/types';
import type { ConversationsRepository, UsersRepository } from '../../ports/repositories';

export function makeInMemoryRepos(seed?: { users?: User[] }) {
  const users = new Map<UserId, User>();
  const conversations = new Map<ConversationId, Conversation>();

  for (const u of seed?.users ?? []) users.set(u.userId, u);

  const usersRepo: UsersRepository = {
    async get(userId) {
      return users.get(userId) ?? null;
    },
    async list() {
      return Array.from(users.values());
    },
  };

  const convosRepo: ConversationsRepository = {
    async get(convoId) {
      return conversations.get(convoId) ?? null;
    },

    async listForUser(userId) {
      return Array.from(conversations.values()).filter(c => c.members.includes(userId));
    },

    async getOrCreateDM(a, b) {
      const key = [a, b].sort().join(':');
      for (const c of conversations.values()) {
        if (c.kind === 'dm' && c.key === key) return c;
      }
      const convoId = cryptoRandomId();
      const convo: Conversation = { convoId, kind: 'dm', key, members: [a, b], messages: [] };
      conversations.set(convoId, convo);
      return convo;
    },

    async createRoom({ name, createdBy }) {
      const convoId = cryptoRandomId();
      const room: Conversation = {
        convoId,
        kind: 'room',
        name,
        createdBy,
        createdAt: Date.now(),
        members: [createdBy],
        messages: [],
      };
      conversations.set(convoId, room);
      return room;
    },

    async addMember(roomId, userId) {
      const c = conversations.get(roomId);
      if (!c || c.kind !== 'room') throw new Error('room not found');
      if (!c.members.includes(userId)) c.members.push(userId);
      return c;
    },

    async appendMessage(convoId, msg) {
      const c = conversations.get(convoId);
      if (!c) throw new Error('conversation not found');
      c.messages.push(msg);
    },
  };

  return { usersRepo, convosRepo };
}

function cryptoRandomId(size = 12): string {
  // base64url is fine for MVP
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('node:crypto') as typeof import('node:crypto');
  return crypto.randomBytes(size).toString('base64url');
}
