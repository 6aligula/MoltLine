import type { Conversation } from '../../domain/entities';
import { getFirestore } from './firestore-client';

const COLLECTION = 'conversations';

/**
 * Escribe una conversación completa en Firestore (document ID = convoId).
 * Pensado para llamarse en background; no bloquea la ruta crítica.
 */
export async function syncConversationToFirestore(convo: Conversation): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(convo.convoId);
  const doc: Record<string, unknown> = {
    convoId: convo.convoId,
    kind: convo.kind,
    members: convo.members,
    messages: convo.messages.map((m) => ({
      messageId: m.messageId,
      convoId: m.convoId,
      from: m.from,
      text: m.text,
      ts: m.ts,
    })),
  };
  if (convo.key != null) doc.key = convo.key;
  if (convo.name != null) doc.name = convo.name;
  if (convo.createdBy != null) doc.createdBy = convo.createdBy;
  if (convo.createdAt != null) doc.createdAt = convo.createdAt;
  await ref.set(doc);
}

/**
 * Devuelve true si la escritura asíncrona a Firestore está activada por env.
 */
export function isFirestoreSyncEnabled(): boolean {
  return process.env.CHAT_PERSIST_FIRESTORE === 'true';
}
