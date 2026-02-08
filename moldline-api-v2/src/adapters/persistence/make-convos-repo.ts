import type { ConversationsRepository, UsersRepository } from '../../ports/repositories';
import type { User } from '../../domain/entities';
import { makeInMemoryRepos } from './inmemory';
import { FirestoreConvosRepo } from './firestore-convos-repo';
import { withFirestoreSync } from './convos-repo-with-firestore-sync';

/**
 * Devuelve usersRepo (siempre in-memory) y convosRepo según env:
 * - CHAT_CONVOS_DRIVER=firebase o CHAT_USE_FIRESTORE=true → Firestore como store principal (Opción B).
 * - CHAT_PERSIST_FIRESTORE=true → RAM + escritura asíncrona a Firestore (Opción A, recomendada).
 * - Por defecto → solo RAM.
 */
export function makeRepos(seed?: { users?: User[] }): { usersRepo: UsersRepository; convosRepo: ConversationsRepository } {
  const inMemory = makeInMemoryRepos(seed);
  const firestoreAsPrimary =
    process.env.CHAT_USE_FIRESTORE === 'true' ||
    process.env.CHAT_CONVOS_DRIVER?.toLowerCase() === 'firebase';
  const persistToFirestore = process.env.CHAT_PERSIST_FIRESTORE === 'true';

  let convosRepo: ConversationsRepository = inMemory.convosRepo;
  if (firestoreAsPrimary) {
    convosRepo = new FirestoreConvosRepo();
  } else if (persistToFirestore) {
    convosRepo = withFirestoreSync(inMemory.convosRepo);
  }
  return { usersRepo: inMemory.usersRepo, convosRepo };
}
