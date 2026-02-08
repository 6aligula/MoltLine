import type { Conversation, Message } from '../../domain/entities';
import type { ConversationId, UserId } from '../../domain/types';
import type { ConversationsRepository } from '../../ports/repositories';
import { getFirestore } from './firestore-client';
import { deterministicDmId, cryptoRandomId } from './convo-id';

const COLLECTION = 'conversations';

function toMessage(data: Record<string, unknown>): Message {
  return {
    messageId: data.messageId as string,
    convoId: data.convoId as string,
    from: data.from as string,
    text: data.text as string,
    ts: typeof data.ts === 'number' ? data.ts : (data.ts as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

function docToConversation(id: string, data: Record<string, unknown>): Conversation {
  const rawMessages = data.messages ?? [];
  const messages = Array.isArray(rawMessages)
    ? rawMessages.map((m: Record<string, unknown>) => toMessage(m))
    : [];
  const createdAt = data.createdAt;
  const createdAtNum =
    typeof createdAt === 'number'
      ? createdAt
      : (createdAt as { toMillis?: () => number })?.toMillis?.() ?? undefined;
  const members = data.members;
  return {
    convoId: id,
    kind: (data.kind as 'dm' | 'room') ?? 'dm',
    members: Array.isArray(members) ? (members as UserId[]) : [],
    key: data.key as string | undefined,
    name: data.name as string | undefined,
    createdBy: data.createdBy as UserId | undefined,
    createdAt: createdAtNum,
    messages,
  };
}

export class FirestoreConvosRepo implements ConversationsRepository {
  private get col() {
    return getFirestore().collection(COLLECTION);
  }

  async get(convoId: ConversationId): Promise<Conversation | null> {
    const snap = await this.col.doc(convoId).get();
    if (!snap.exists) return null;
    return docToConversation(snap.id, snap.data()!);
  }

  async listForUser(userId: UserId): Promise<Conversation[]> {
    const snap = await this.col.where('members', 'array-contains', userId).get();
    return snap.docs.map((d) => docToConversation(d.id, d.data()));
  }

  async getOrCreateDM(a: UserId, b: UserId): Promise<Conversation> {
    const convoId = deterministicDmId(a, b);
    const ref = this.col.doc(convoId);
    const snap = await ref.get();
    if (snap.exists) return docToConversation(snap.id, snap.data()!);
    const key = [a, b].sort().join(':');
    const doc = {
      convoId,
      kind: 'dm',
      key,
      members: [a, b],
      messages: [],
    };
    await ref.set(doc);
    return docToConversation(convoId, doc);
  }

  async createRoom(params: { name: string; createdBy: UserId }): Promise<Conversation> {
    const convoId = cryptoRandomId();
    const ref = this.col.doc(convoId);
    const now = Date.now();
    const doc = {
      convoId,
      kind: 'room',
      name: params.name,
      createdBy: params.createdBy,
      createdAt: now,
      members: [params.createdBy],
      messages: [],
    };
    await ref.set(doc);
    return docToConversation(convoId, doc);
  }

  async addMember(roomId: ConversationId, userId: UserId): Promise<Conversation> {
    const ref = this.col.doc(roomId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('room not found');
    const data = snap.data()!;
    if (data.kind !== 'room') throw new Error('room not found');
    const members = data.members ?? [];
    if (!members.includes(userId)) {
      await ref.update({ members: [...members, userId] });
    }
    const updated = await ref.get();
    return docToConversation(updated.id, updated.data()!);
  }

  async appendMessage(convoId: ConversationId, msg: Message): Promise<void> {
    const ref = this.col.doc(convoId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('conversation not found');
    const data = snap.data()!;
    const messages = Array.isArray(data.messages) ? [...data.messages] : [];
    messages.push({
      messageId: msg.messageId,
      convoId: msg.convoId,
      from: msg.from,
      text: msg.text,
      ts: msg.ts,
    });
    await ref.update({ messages });
  }
}
