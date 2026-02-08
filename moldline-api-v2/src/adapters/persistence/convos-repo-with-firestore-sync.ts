import type { Conversation } from '../../domain/entities';
import type { ConversationId, UserId } from '../../domain/types';
import type { ConversationsRepository } from '../../ports/repositories';
import { syncConversationToFirestore, isFirestoreSyncEnabled } from './firestore-sync';

/**
 * Wrapper que delega en el repo primario (RAM) y, si CHAT_PERSIST_FIRESTORE=true,
 * escribe en Firestore en background tras cada mutación (sin bloquear la respuesta).
 */
export function withFirestoreSync(primary: ConversationsRepository): ConversationsRepository {
  function scheduleSync(convo: Conversation | null): void {
    if (!isFirestoreSyncEnabled() || !convo) return;
    syncConversationToFirestore(convo).catch((err) =>
      console.error('[Firestore sync]', convo.convoId, err)
    );
  }

  return {
    async get(convoId) {
      return primary.get(convoId);
    },

    async listForUser(userId) {
      return primary.listForUser(userId);
    },

    async getOrCreateDM(a, b) {
      const convo = await primary.getOrCreateDM(a, b);
      scheduleSync(convo);
      return convo;
    },

    async createRoom(params) {
      const convo = await primary.createRoom(params);
      scheduleSync(convo);
      return convo;
    },

    async addMember(roomId, userId) {
      const convo = await primary.addMember(roomId, userId);
      scheduleSync(convo);
      return convo;
    },

    async appendMessage(convoId, msg) {
      await primary.appendMessage(convoId, msg);
      const convo = await primary.get(convoId);
      scheduleSync(convo);
    },
  };
}
