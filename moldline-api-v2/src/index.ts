import { makeUseCases } from './application/usecases';
import { makeInMemoryRepos } from './adapters/persistence/inmemory';
import { InProcessWsGateway } from './adapters/realtime/wsGateway';
import { buildServer } from './adapters/http/server';

function nanoid(size = 12) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('node:crypto') as typeof import('node:crypto');
  return crypto.randomBytes(size).toString('base64url');
}

const PORT = Number(process.env.PORT || 18000);

const { usersRepo, convosRepo } = makeInMemoryRepos({
  users: [
    { userId: 'a', name: 'User A' },
    { userId: 'b', name: 'User B' },
  ],
});

const realtime = new InProcessWsGateway();

// Seed a default DM so the UI has something to select immediately.
void convosRepo.getOrCreateDM('a', 'b');

const usecases = makeUseCases({
  usersRepo,
  convosRepo,
  realtime,
  id: () => nanoid(),
  now: () => Date.now(),
});

const { server } = buildServer({ usecases, realtime });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MoldLine API listening on http://0.0.0.0:${PORT}`);
});
