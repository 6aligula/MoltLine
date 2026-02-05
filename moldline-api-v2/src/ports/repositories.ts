import type { Conversation, Message, User } from '../domain/entities';
import type { ConversationId, UserId } from '../domain/types';

export interface UsersRepository {
  get(userId: UserId): Promise<User | null>;
  list(): Promise<User[]>;
}

export interface ConversationsRepository {
  get(convoId: ConversationId): Promise<Conversation | null>;
  listForUser(userId: UserId): Promise<Conversation[]>;
  getOrCreateDM(a: UserId, b: UserId): Promise<Conversation>;
  createRoom(params: { name: string; createdBy: UserId }): Promise<Conversation>;
  addMember(roomId: ConversationId, userId: UserId): Promise<Conversation>;
  appendMessage(convoId: ConversationId, msg: Message): Promise<void>;
}
