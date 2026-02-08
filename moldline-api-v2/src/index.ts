import { makeUseCases } from './application/usecases';
import { makeRepos } from './adapters/persistence/make-convos-repo';
import { InProcessWsGateway } from './adapters/realtime/wsGateway';
import { buildServer } from './adapters/http/server';

function nanoid(size = 12) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('node:crypto') as typeof import('node:crypto');
  return crypto.randomBytes(size).toString('base64url');
}

const PORT = Number(process.env.PORT || 18000);

const { usersRepo, convosRepo } = makeRepos({
  users: [
    { userId: 'a', name: 'User A' },
    { userId: 'b', name: 'User B' },
  ],
});

const convosMode =
  process.env.CHAT_USE_FIRESTORE === 'true' || process.env.CHAT_CONVOS_DRIVER?.toLowerCase() === 'firebase'
    ? 'Firestore primary'
    : process.env.CHAT_PERSIST_FIRESTORE === 'true'
      ? 'RAM + Firestore sync'
      : 'RAM only';
console.log(`Convos: ${convosMode}`);

const realtime = new InProcessWsGateway();

// Seed un DM por defecto solo cuando convos están en memoria (no en Firestore).
const useFirestore =
  process.env.CHAT_USE_FIRESTORE === 'true' ||
  process.env.CHAT_CONVOS_DRIVER?.toLowerCase() === 'firebase';
if (!useFirestore) void convosRepo.getOrCreateDM('a', 'b');

const usecases = makeUseCases({
  usersRepo,
  convosRepo,
  realtime,
  id: () => nanoid(),
  now: () => Date.now(),
});

const { server } = buildServer({ usecases, realtime });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MoldLine API listening on http://0.0.0.0:${PORT} (convos: ${convosMode})`);
});
